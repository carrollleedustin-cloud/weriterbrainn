import { NarrativeRepository } from "../repositories/NarrativeRepository.js";

/**
 * Timeline + causality: order events, expose cause→effect.
 */
export class TimelineService {
  constructor({ narrativeRepository }) {
    this.narrativeRepo = narrativeRepository;
  }

  async getTimeline(userId) {
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const objects = await this.narrativeRepo.findObjectsByProject(project.id);
    const edges = await this.narrativeRepo.findEdgesByProject(project.id);

    const events = objects.filter((o) => (o.object_type || "").toLowerCase() === "event");
    const causeEdges = edges.filter((e) =>
      (e.edge_type || "").toLowerCase().includes("causes")
    );

    const idToObj = new Map(objects.map((o) => [o.id, o]));
    const causes = new Map();
    for (const e of causeEdges) {
      if (!causes.has(e.target_id)) causes.set(e.target_id, []);
      const src = idToObj.get(e.source_id);
      if (src) causes.get(e.target_id).push({ event_id: e.source_id, name: src.name });
    }

    const withTemporal = events.map((e) => ({
      id: e.id,
      name: e.name,
      summary: e.summary,
      temporal: e.metadata?.temporal,
      participants: e.metadata?.participants,
      location: e.metadata?.location,
      created_at: e.created_at,
      caused_by: causes.get(e.id) || [],
    }));

    // Sort: explicit temporal first, then created_at
    const parseTemporal = (t) => {
      if (!t) return null;
      const n = parseInt(t, 10);
      if (!isNaN(n)) return n;
      if (typeof t === "string" && t.match(/\d{4}/)) return parseInt(t.match(/\d{4}/)[0], 10);
      return null;
    };

    withTemporal.sort((a, b) => {
      const ta = parseTemporal(a.temporal);
      const tb = parseTemporal(b.temporal);
      if (ta != null && tb != null) return ta - tb;
      if (ta != null) return -1;
      if (tb != null) return 1;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });

    return { events: withTemporal, project_id: project.id };
  }
}
