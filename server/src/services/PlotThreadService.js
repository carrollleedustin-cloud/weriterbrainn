import { NarrativeRepository } from "../repositories/NarrativeRepository.js";

const THREAD_STATUSES = ["seeded", "active", "escalating", "converging", "climaxing", "resolved", "reopened", "dormant", "abandoned"];

/**
 * Plot Thread intelligence: lifecycle, starvation, payoff.
 */
export class PlotThreadService {
  constructor({ narrativeRepository }) {
    this.narrativeRepo = narrativeRepository;
  }

  async getPlotThreads(userId) {
    const project = await this.narrativeRepo.getOrCreateDefaultProject(userId);
    const objects = await this.narrativeRepo.findObjectsByProject(project.id);
    const edges = await this.narrativeRepo.findEdgesByProject(project.id);

    const threads = objects.filter((o) => (o.object_type || "").toLowerCase() === "plot_thread");
    const idToObj = new Map(objects.map((o) => [o.id, o]));

    const advances = edges.filter((e) =>
      (e.edge_type || "").toLowerCase().includes("advances")
    );
    const threadToEvents = new Map();
    for (const e of advances) {
      const src = idToObj.get(e.source_id);
      const tgt = idToObj.get(e.target_id);
      const thread = threads.find((t) => t.id === e.target_id || t.id === e.source_id);
      if (thread) {
        const otherId = e.source_id === thread.id ? e.target_id : e.source_id;
        if (!threadToEvents.has(thread.id)) threadToEvents.set(thread.id, []);
        const other = idToObj.get(otherId);
        if (other) threadToEvents.get(thread.id).push(other.name);
      }
    }

    const result = threads.map((t) => ({
      id: t.id,
      name: t.name,
      summary: t.summary,
      status: t.metadata?.status || "active",
      related_events: threadToEvents.get(t.id) || [],
      created_at: t.created_at,
    }));

    return { threads: result, project_id: project.id };
  }

  async getThreadSummary(userId) {
    const { threads } = await this.getPlotThreads(userId);
    const byStatus = {};
    for (const s of THREAD_STATUSES) byStatus[s] = 0;
    for (const t of threads) {
      const s = (t.status || "active").toLowerCase();
      byStatus[s] = (byStatus[s] || 0) + 1;
    }
    return {
      total: threads.length,
      by_status: byStatus,
      active_count: threads.filter((t) => ["active", "escalating", "converging"].includes((t.status || "").toLowerCase())).length,
    };
  }
}
