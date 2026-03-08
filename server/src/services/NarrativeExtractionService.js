import OpenAI from "openai";
import { config } from "../../config.js";
import { NarrativeRepository } from "../repositories/NarrativeRepository.js";
import { nameSimilarity } from "../lib/entityDedup.js";
import { NARRATIVE_OBJECT_TYPE_TO_DB } from "../domain/index.js";

const NARRATIVE_EXTRACTION_PROMPT = `You are a narrative intelligence engine. Extract structured story elements from the text.

Output valid JSON only, no markdown. Use these keys:

1. "entities" — people, places, things, concepts. Each: name, type (character|location|object|faction|event|plot_thread|lore_rule|secret|theme|other), description (brief).
2. "events" — things that happen. Each: summary, participants (names), temporal (when if stated), location (if stated).
3. "relationships" — connections. Each: source, target, type (related_to|character_present_at_event|character_knows_secret|character_betrayed|character_loves|character_fears|event_causes_event|event_advances_plot_thread|secret_revealed_in_event|theme_reinforced_by).
4. "plot_threads" — tension arcs. Each: title, summary, status (seeded|active|escalating|resolved|dormant).
5. "canon_facts" — established truths. Each: fact (string), confidence (0-1).
6. "emotional_beats" — feeling shifts. Each: beat (short description), intensity (0-1).

Map types to: character, event, scene, location, object, faction, plot_thread, lore_rule, secret, theme, other.

Example shape:
{
  "entities": [{"name": "Marcus", "type": "character", "description": "..."}],
  "events": [{"summary": "Marcus discovers the truth", "participants": ["Marcus"], "temporal": null}],
  "relationships": [{"source": "Marcus", "target": "The Secret", "type": "character_knows_secret"}],
  "plot_threads": [{"title": "The betrayal", "summary": "...", "status": "active"}],
  "canon_facts": [{"fact": "Marcus is the heir", "confidence": 0.9}],
  "emotional_beats": [{"beat": "shock at revelation", "intensity": 0.8}]
}

Text:
`;

let client = null;

function getClient() {
  if (!client) client = new OpenAI({ apiKey: config.openaiApiKey });
  return client;
}

const SIMILARITY_THRESHOLD = 0.82;

export class NarrativeExtractionService {
  constructor({ narrativeRepository, embeddingService, canonLedgerService = null, knowledgeStateService = null }) {
    this.narrativeRepo = narrativeRepository;
    this.embeddingService = embeddingService;
    this.canonLedger = canonLedgerService;
    this.knowledgeState = knowledgeStateService;
  }

  async extractNarrative(text) {
    if (!text?.trim()) return { entities: [], events: [], relationships: [], plot_threads: [], canon_facts: [], emotional_beats: [] };
    if (!config.openaiApiKey) return { entities: [], events: [], relationships: [], plot_threads: [], canon_facts: [], emotional_beats: [] };

    const resp = await getClient().chat.completions.create({
      model: config.openaiModel,
      messages: [{ role: "user", content: NARRATIVE_EXTRACTION_PROMPT + text.slice(0, 12000) }],
      temperature: 0.15,
    });

    let content = (resp.choices[0]?.message?.content || "").trim();
    if (!content) return { entities: [], events: [], relationships: [], plot_threads: [], canon_facts: [], emotional_beats: [] };

    if (content.startsWith("```")) {
      const lines = content.split("\n");
      content = lines.slice(1, lines[lines.length - 1] === "```" ? -1 : undefined).join("\n");
    }

    try {
      const data = JSON.parse(content);
      return {
        entities: data.entities || [],
        events: data.events || [],
        relationships: data.relationships || [],
        plot_threads: data.plot_threads || [],
        canon_facts: data.canon_facts || [],
        emotional_beats: data.emotional_beats || [],
      };
    } catch {
      return { entities: [], events: [], relationships: [], plot_threads: [], canon_facts: [], emotional_beats: [] };
    }
  }

  async addToNarrativeUniverse(extracted, userId, sourcePassage = null) {
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const projectId = project.id;

    const nameToObj = {};
    const existing = await this.narrativeRepo.findObjectsByProject(projectId);

    const resolveOrCreate = async (name, type, summary, meta = {}) => {
      const n = (name || "").trim();
      if (!n) return null;

      let obj = await this.narrativeRepo.findObjectByNameAndProject(projectId, n);
      if (obj) {
        nameToObj[n.toLowerCase()] = obj;
        return obj;
      }
      for (const ex of existing) {
        if (nameSimilarity(n, ex.name) >= SIMILARITY_THRESHOLD) {
          nameToObj[n.toLowerCase()] = ex;
          return ex;
        }
      }

      const objType = NARRATIVE_OBJECT_TYPE_TO_DB[type] ? type : "other";
      obj = await this.narrativeRepo.createObject({
        projectId,
        objectType: objType,
        name: n,
        summary: summary || null,
        metadata: meta,
        canonState: "draft",
        sourcePassage: sourcePassage?.slice(0, 500) || null,
      });
      nameToObj[n.toLowerCase()] = obj;
      existing.push(obj);
      return obj;
    };

    // Entities
    for (const e of extracted.entities) {
      await resolveOrCreate(
        e.name,
        (e.type || "other").toLowerCase(),
        e.description,
        e.temporal ? { temporal: e.temporal } : {}
      );
    }

    // Events as narrative objects
    for (const ev of extracted.events) {
      const name = ev.summary?.slice(0, 200) || `Event: ${JSON.stringify(ev).slice(0, 100)}`;
      await resolveOrCreate(name, "event", ev.summary, {
        participants: ev.participants,
        temporal: ev.temporal,
        location: ev.location,
      });
    }

    // Plot threads
    for (const pt of extracted.plot_threads) {
      await resolveOrCreate(
        pt.title || pt.summary?.slice(0, 100) || "Untitled thread",
        "plot_thread",
        pt.summary,
        { status: pt.status }
      );
    }

    // Relationships (edges)
    for (const rel of extracted.relationships) {
      const srcName = (rel.source || "").trim().toLowerCase();
      const tgtName = (rel.target || "").trim().toLowerCase();
      const relType = (rel.type || "related_to").toLowerCase().replace(/\s+/g, "_");
      const srcObj = nameToObj[srcName];
      const tgtObj = nameToObj[tgtName];
      if (srcObj && tgtObj && srcObj.id !== tgtObj.id) {
        const exists = await this.narrativeRepo.edgeExists(projectId, srcObj.id, tgtObj.id, relType);
        if (!exists) {
          await this.narrativeRepo.createEdge({
            projectId,
            sourceId: srcObj.id,
            targetId: tgtObj.id,
            edgeType: relType,
          });
        }
        if (this.knowledgeState && relType === "character_knows_secret") {
          const charId = srcObj.id;
          const secretKey = tgtObj?.name || tgtName;
          if (charId && secretKey) {
            await this.knowledgeState.recordKnowledge({
              userId,
              characterId: charId,
              factKey: secretKey,
              assertionType: "knows",
              confidence: 0.8,
              sourcePassage: sourcePassage?.slice(0, 300) || null,
              sourceObjectId: tgtObj?.id,
            }).catch(() => {});
          }
        }
      }
    }

    // Canon facts → Canon Ledger (structured facts) + ledger events
    for (const cf of extracted.canon_facts) {
      if (cf.fact) {
        if (this.canonLedger) {
          await this.canonLedger.recordFact({
            userId,
            factType: "other",
            factValue: cf.fact,
            sourcePassage: sourcePassage?.slice(0, 500) || null,
            confidence: cf.confidence ?? 0.8,
            canonState: "draft",
          }).catch(() => {});
        } else {
          await this.narrativeRepo.recordCanonEvent({
            projectId,
            eventType: "canon_established",
            payload: { fact: cf.fact, confidence: cf.confidence ?? 0.8 },
            sourcePassage: sourcePassage?.slice(0, 500) || null,
          });
        }
      }
    }

    return {
      project_id: projectId,
      objects_created: Object.keys(nameToObj).length,
    };
  }

  async extractAndIngest(text, userId) {
    const extracted = await this.extractNarrative(text);
    const result = await this.addToNarrativeUniverse(extracted, userId, text);
    return { extracted, ...result };
  }
}
