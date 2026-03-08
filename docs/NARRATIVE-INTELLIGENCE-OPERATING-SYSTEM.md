# The Narrative Intelligence Operating System

**Strategic Blueprint — WeriterBrainn → NIOS**

*A category-defining creative platform for authors and story creators*

---

## 1. Product Thesis

### What This Is

The **Narrative Intelligence Operating System (NIOS)** is not a writing app. It is a **living story universe engine** that understands narratives as structured, evolving, machine-reasonable worlds.

Text is one surface. The story is a **Narrative Universe Model** — entities, events, relationships, canon, causality, character psychology, plot threads, and reader impact — all first-class objects the system can query, validate, simulate, and explain.

### Why It Matters

The market treats stories as documents: pages, folders, editors. Authors suffer:
- **Canon drift** — characters die and reappear, timelines break, lore contradicts
- **Structural blindness** — weak middles, abandoned threads, missed payoffs
- **Voice erasure** — AI outputs that don’t sound like the author
- **Solo creation** — no story-aware collaborator

NIOS treats stories as **living universes**. It sees what authors cannot easily see. It protects canon. It learns voice. It simulates consequences. It collaborates like a story mind, not a text generator.

### Why It Creates a New Category

| Current Category | NIOS Category |
|------------------|---------------|
| Word processor | Narrative command bridge |
| Note app with AI | Story intelligence platform |
| Document editor | Universe composer |
| Writing assistant | Co-creative story mind |
| Static notes | Event-sourced canon ledger |
| Generic chat | Story-strategic guidance |

**Category promise:** *A story-aware creative platform that understands your universe, protects canon, learns your voice, simulates narrative possibilities, reveals hidden structure, and collaborates like a story mind.*

---

## 2. Current-System Upgrade Strategy

### What to Preserve

| Asset | Why Keep | Migration Path |
|-------|----------|----------------|
| **PostgreSQL + pgvector** | Vector search, HNSW, mature tooling | Add narrative tables; keep embeddings |
| **Embedding pipeline** | Semantic search, dedup, retrieval | Extend to narrative entities; add metadata |
| **Knowledge graph (nodes/edges)** | Entity-relationship core | Evolve into Story Knowledge Graph; extend schema |
| **Entity extraction (LLM)** | Already extracts entities, relations, temporal | Expand prompt for events, canon, plot threads, emotional beats |
| **Persona / style extraction** | Voice metrics, profile building | Rename and deepen as Author Voice Fingerprint |
| **RAG assembly** | Context building, token budget | Extend to canon-aware, character-aware, thread-aware retrieval |
| **Chat + streaming** | Proven UX | Reframe as Story Strategist / Forge co-pilot |
| **BullMQ + Redis** | Async jobs, rate limit, cache | Keep for extraction, compilation, simulation jobs |
| **Auth, RLS, Zod** | Security, tenant isolation | Unchanged |
| **Netlify deploy** | Operational baseline | Keep; scale workers separately |

### What to Replace

| Component | Why Replace | Replacement |
|-----------|-------------|-------------|
| **Flat memory model** | Document-centric; no canon, no causality | Narrative Universe Model + Canon Ledger |
| **Memory types (belief, goal, note)** | Generic; not story-native | Story object types (Character, Event, PlotThread, LoreRule, etc.) |
| **Single-tier memory** | No provenance, no branches | Event-sourced Canon Ledger with branch/merge |
| **Generic knowledge graph schema** | Person/Concept/Project/Event/Other | Narrative node families: Character, Event, Scene, Location, PlotThread, Secret, LoreRule, etc. |
| **Simple relationship_type** | Only `related_to` + inferred | Semantic edge types: character_betrayed_character, event_causes_event, etc. |
| **Writing assistant (improve/expand/rewrite)** | No story context | Forge: scene-aware, character-aware, thread-aware generation |
| **Analytics events (accepted/regenerated)** | Generic productivity | Reader impact signals, continuity events, canon changes |
| **Dashboard UX** | Tab-based, flat | Spatial workspaces: Pulse, Forge, Constellation, River, Loom, etc. |

### What to Re-Platform

| Area | Current State | Future State |
|------|---------------|--------------|
| **Data model** | memories + memory_embeddings + kg_nodes/edges | Narrative objects + Canon Ledger + Story KG |
| **Extraction** | Entities + relationships | Full narrative extraction (events, canon, threads, emotional beats, continuity risks) |
| **Search** | Semantic + FTS over memories | Multi-modal: graph, timeline, canon, character, thread |
| **Generation** | RAG + persona hints | Canon-grounded, character-grounded, style-fingerprinted, thread-aware |
| **UI paradigm** | Pages, panels, editor | Spatial workspaces, ambient intelligence, cinematic focus |

### Migration Strategy for Existing Users

1. **Phase 0 — Shadow mode**  
   Run new extraction pipeline in parallel; build narrative model from existing memories + graph. No breaking changes.

2. **Phase 1 — Dual write**  
   New writes populate both legacy tables and narrative tables. Canon Ledger seeded from memories with `memory_type` mapped to narrative types (e.g., belief→LoreRule, goal→PlotThread).

3. **Phase 2 — Narrative-first reads**  
   Primary reads from narrative model; legacy as fallback. Author-facing UI still familiar; new capabilities appear progressively.

4. **Phase 3 — Cutover**  
   Deprecate legacy memory/graph read paths. Full NIOS surface. Export tool for users who want legacy backup.

5. **Preserve continuity**  
   Existing conversations, memories, and graph nodes remain queryable. Canon Ledger treats them as “legacy import” with provenance.

---

## 3. Future-State Architecture

### Core Services

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         NARRATIVE INTELLIGENCE LAYER                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Story Compiler  │  Continuity Guardian  │  Plot Thread Engine  │  Timeline   │
│  Canon Ledger    │  Consequence Preview  │  Character Engine    │  Simulator  │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INTELLIGENCE ORCHESTRATION                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Extraction Pipeline  │  Voice Fingerprint  │  Reader Impact  │  Story Q&A   │
│  RAG Assembly         │  Style-Aware Gen    │  Strategist     │  Search      │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA & RETRIEVAL                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL (relational + pgvector)  │  Canon Ledger (event-sourced)         │
│  Story Knowledge Graph              │  Search Index (semantic + FTS)         │
│  Narrative Object Store             │  Cache (Redis)                         │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Model Overview

- **Relational store:** Users, projects, workspaces, permissions.
- **Narrative Object Store:** Characters, events, scenes, locations, plot threads, lore rules, secrets, etc. — structured, versioned, branchable.
- **Story Knowledge Graph:** Semantic graph over narrative objects; edges typed (character_betrayed_character, event_causes_event).
- **Canon Ledger:** Event-sourced append-only log of canon facts; supports provenance, rollback, branch/merge.
- **Vector layer:** Embeddings for entities, events, passages; hybrid retrieval.
- **Search index:** Full-text + semantic for passages, canon facts, thread summaries.

### Intelligence Layers

| Layer | Responsibility |
|-------|----------------|
| **Extraction Pipeline** | Parse text → entities, events, relationships, canon facts, emotional beats, continuity risks |
| **Story Compiler** | Validate new text against canon; emit continuity checks, contradictions |
| **Continuity Guardian** | Real-time checks; tiered alerts (soft risk, likely contradiction, canon break) |
| **Canon Ledger** | Record, version, branch, merge; explainability (“why does the system believe this?”) |
| **Plot Thread Engine** | Track thread lifecycle; detect starvation, overload, weak payoff |
| **Timeline + Causality** | Scene order, event order, cause→effect; “what caused this? what did this cause?” |
| **Character Engine** | Goals, fears, knowledge state, secrets; in-character reasoning |
| **Voice Fingerprint** | Living author style model; style-aware generation |
| **Story Simulator** | What-if sandbox; consequence preview |
| **Reader Impact** | Estimated confusion, surprise, tension, pacing |
| **Story Q&A** | Natural-language queries over graph + canon + timeline |
| **Story Strategist** | High-level planning; outline, pacing, thread weaving, payoff timing |

### Generation Stack

- **Context assembly:** Canon, characters, threads, timeline, voice fingerprint.
- **Grounding:** Citations, confidence, “what canon this used.”
- **Modes:** Continue, dialogue, rewrite for tension, expand, compress, propose escalation, change POV, etc.
- **Voice control:** Exact, close, exploratory, deliberate departure.

---

## 4. Narrative Object Model

### Canon States

| State | Meaning |
|-------|---------|
| `confirmed` | Author-accepted; current canon |
| `draft` | Proposed; not yet confirmed |
| `speculative` | What-if; sandbox only |
| `deprecated` | Superseded or retconned |
| `branch_alt` | Alternate branch; not main |
| `ambiguous` | Disputed or unresolved |

### Node Families (Story KG)

| Family | Purpose |
|--------|---------|
| Character | People, agents; psychology, knowledge, secrets |
| Event | Things that happen; cause, effect, participants |
| Scene | Unit of story; contains events |
| Chapter | Structural unit |
| Book / Series | Container |
| Location | Place |
| Object | Physical thing |
| Faction | Group, organization |
| PlotThread | Tension arc; lifecycle, promises, payoffs |
| LoreRule | World rule; constrains events |
| Secret | Hidden information; who knows |
| Theme | Recurring idea |
| Motif | Recurring symbol/pattern |
| EmotionalBeat | Feeling shift |
| Promise | Setup; must pay off |
| Payoff | Resolution of setup |

### Edge Families

| Edge | Meaning |
|------|---------|
| character_present_at_event | Character participated |
| character_knows_secret | Character has information |
| character_betrayed_character | Betrayal |
| character_loves / fears / hates | Relationship |
| event_causes_event | Causality |
| event_advances_plot_thread | Plot progression |
| scene_contains_event | Composition |
| lore_rule_constrains_event | World logic |
| secret_revealed_in_event | Information flow |
| theme_reinforced_by_scene | Thematic resonance |
| promise_resolved_by_payoff | Setup→payoff |

### Canon Ledger Events

```text
- canon_established(entity_id, fact, source_passage, confidence)
- canon_superseded(entity_id, old_fact, new_fact, reason)
- canon_deprecated(entity_id, fact, reason)
- branch_created(branch_id, from_canon_at)
- branch_merged(branch_id, into_main, conflicts_resolved)
```

### Extraction Output Schema (Extended)

```json
{
  "entities": [],
  "events": [],
  "relationships": [],
  "locations": [],
  "objects": [],
  "plot_threads": [],
  "lore_rules": [],
  "canon_facts": [],
  "knowledge_state_changes": [],
  "emotional_beats": [],
  "themes": [],
  "promises": [],
  "payoffs": [],
  "secrets_created": [],
  "secrets_revealed": [],
  "continuity_risks": [],
  "reader_impact_signals": []
}
```

---

## 5. UI/UX System

### Navigation Model

**Spatial workspaces**, not tabs. Each workspace is a distinct mode:

| Space | Role | Core Interaction |
|-------|------|------------------|
| **Pulse** | Home | Living overview: active threads, continuity pressure, momentum, recent canon, opportunities |
| **Forge** | Writing | Context-rich scene engine; ambient canon, in-character help, live continuity |
| **Constellation** | Relationships | Character/faction network; loyalties, betrayals, secrets |
| **River** | Chronology | Timeline + causality; scenes, chapters, branches |
| **Loom** | Tension | Plot threads, payoffs, pressure, dormancy |
| **Cast** | Characters | Deep character models; arc, behavior, knowledge state |
| **Atlas** | World | Locations, lore, objects, rules |
| **Observatory** | Voice | Author style, drift, narrative rhythm |
| **Simulator** | Sandbox | What-if; consequence preview |
| **Signal** | Alerts | Continuity, pacing, risk, opportunity |

### Design Language

- **Premium, cinematic, spatial** — depth, motion, focus gradients.
- **Ambient intelligence** — hints, not popups; “whisper, not shout.”
- **Meaningful visualization** — each chart/map answers a strategic question.
- **Progressive disclosure** — simple by default; power available on demand.
- **Distinct identity** — unmistakable; not generic SaaS.

### Signature Flows

1. **First Five Minutes:** Import manuscript → watch story map build → see characters, threads, locations → first continuity findings → immediate “it understands my story.”
2. **Write in Forge:** Open scene → context panel shows canon, characters, threads → write → gentle continuity nudge if needed.
3. **Consequence Preview:** Before accepting major edit → ripple view: impacted threads, characters, setups.
4. **Branch/Merge:** Fork storyline → test alternate canon → compare → merge validated changes.
5. **Story Q&A:** Ask “Who knows the council secret by Chapter 18?” → answer with citations and confidence.

---

## 6. Flagship Differentiators

### 1. Story Compiler

Every new scene is **compiled** against canon, character truth, timeline, and lore.

- Detects: dead characters alive, timeline impossibilities, lore violations, knowledge leaks, broken promises.
- Tiers: soft risk, likely contradiction, canon break, strategic opportunity.
- Each alert: summary, confidence, source passages, related canon, suggested fix, “mark intentional.”

**Moat:** No other tool validates narrative integrity at this granularity.

### 2. Consequence Preview

Before accepting a major edit, the system shows **ripple effects**:

- Impacted plot threads
- Affected characters (knowledge, motivation)
- Broken setups
- Shifted knowledge states
- New opportunities

**Moat:** Authors see downstream impact before committing. Reduces regret and rewrites.

### 3. Narrative Branch / Merge

Authors can **fork storylines**, test alternate canon, compare outcomes, and selectively **merge** validated changes.

- Branch from any point.
- Sandbox changes without touching main.
- Compare branches.
- Merge with conflict resolution.

**Moat:** Git for stories. Unique in creative tools.

### 4. Story Simulator (Bonus Differentiator)

**What-if sandbox** for narrative moves:

- “What would this character do next?”
- “If this secret is revealed here, what cascades?”
- “Which alliance is most fragile?”

Grounded in character psychology, loyalties, knowledge, lore. Feels like a story laboratory.

### 5. Reader Impact Intelligence (Bonus)

Estimates **reader-facing effects**:

- Confusion risk
- Surprise density
- Emotional intensity
- Tension rhythm
- Exposition drag
- Payoff force

Second lens: how the story may feel in motion, not just how it is built.

---

## 7. Roadmap

### Phase 0 — Strategic Audit (Weeks 1–2)

- [x] CTO audit of current system
- [ ] Map conceptual debt; identify primitives to change
- [ ] Define migration strategy for existing data
- [ ] Technical spike: Canon Ledger schema, event model

### Phase 1 — Narrative Core (Weeks 3–8)

- [ ] Narrative universe schema (tables, types)
- [ ] Canon Ledger (append-only, provenance)
- [ ] Extended extraction pipeline (events, canon, threads, emotional beats)
- [ ] Story Knowledge Graph (extended nodes/edges)
- [ ] First-pass ingestion from existing memories + graph
- [ ] Dual-write path (legacy + narrative)

**Deliverable:** Story universe builds from text; canon recorded; graph populated.

### Phase 2 — Canon Intelligence (Weeks 9–14)

- [ ] Story Compiler (validation rules, contradiction detection)
- [ ] Continuity Guardian (real-time checks, tiered alerts)
- [ ] Timeline + causality engine
- [ ] Plot Thread intelligence (lifecycle, starvation, payoff)
- [ ] Continuity Debugger (inspect conflicts, evidence)

**Deliverable:** Authors get compilation feedback; continuity is enforceable.

### Phase 3 — Character + Voice (Weeks 15–20)

- [ ] Character models (goals, fears, knowledge, secrets)
- [ ] Author Voice Fingerprint (from existing persona + manuscript)
- [ ] Style-aware generation (canon + character + voice)
- [ ] Drift detection (voice, character)

**Deliverable:** Generation feels like “author, amplified.”

### Phase 4 — Interface Revolution (Weeks 21–28)

- [ ] Pulse (living home)
- [ ] Forge (context-rich writing)
- [ ] Constellation (relationship map)
- [ ] River (timeline + causality)
- [ ] Loom (plot threads)
- [ ] Cast (character intelligence)
- [ ] Design system; spatial navigation

**Deliverable:** New interaction model; unmistakable UX.

### Phase 5 — Simulation + Strategy (Weeks 29–34)

- [ ] Consequence Preview
- [ ] What-If Sandbox
- [ ] Narrative Branch / Merge
- [ ] Story Strategist (high-level planning)
- [ ] Reader Impact Intelligence
- [ ] Story Q&A (natural language + citations)

**Deliverable:** Full differentiator set; category-defining capabilities.

### Phase 6 — Polish + Category Separation (Weeks 35–40)

- [ ] Onboarding magic (import → instant story map)
- [ ] Performance (1k+ chapters, 500+ characters)
- [ ] Explainability refinement
- [ ] Signature visual identity
- [ ] Packaging, positioning, launch

**Deliverable:** Product that makes users say “I can never go back.”

---

## 8. Risks + Mitigations

| Risk | Mitigation |
|------|------------|
| **Extraction accuracy** | Confidence scores; author correction loop; human-override for canon |
| **Scale (1k+ chapters)** | Partitioning; lazy load; incremental compilation; background jobs |
| **UX complexity** | Progressive disclosure; simple default; power on demand |
| **Migration breaking users** | Shadow mode; dual write; legacy export; clear communication |
| **Explainability trust** | Citations; “why we believe this”; editable canon |
| **AI cost** | Caching; batch extraction; tiered model usage |
| **Category education** | Strong onboarding; “first five minutes magic”; clear positioning |
| **Technical debt** | Phased rebuild; preserve leverage; deprecate incrementally |

---

## 9. North-Star Vision

**What it feels like to use NIOS:**

You open the app. **Pulse** greets you: your story’s nervous system — which threads are hot, where continuity is under pressure, what opportunities the system has spotted. No blank page. The story is already present.

You step into **Forge** to write. The scene knows its place in the timeline. It knows which characters are present, what they know, what they hide. Suggestions feel in-character. Warnings are gentle: “Marcus died in Chapter 12 — did you mean his brother?” You stay in flow. Intelligence whispers.

You open **Constellation** to see the relationship web. Betrayals, loyalties, secrets. You trace who knows what. You notice a neglected thread.

You open **River** and see cause and effect. “This event caused that. This made this possible.” The timeline is not a list; it’s a causality map.

You ask: *“Who knows the council secret by Chapter 18?”* The system answers with evidence. You trust it because it shows its work.

Before you accept a major edit, **Consequence Preview** shows you the ripples. You see what breaks, what shifts, what becomes possible. You decide with full context.

You fork the story. You test a darker twist in a branch. You compare. You merge what works. The system never loses canon.

You are no longer writing alone. You are creating inside a **living story universe with a mind of its own**.

---

*End of Narrative Intelligence Operating System Blueprint*
