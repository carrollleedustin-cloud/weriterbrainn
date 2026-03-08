export default function Home() {
  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.25)] bg-[linear-gradient(135deg,rgba(24,17,40,0.95),rgba(16,12,28,0.85))] p-10 shadow-[var(--shadow-md)] shimmer-band">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,92,246,0.3),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(192,132,252,0.25),transparent_40%)]" />
        <div className="absolute -top-16 left-10 h-40 w-40 rounded-full bg-[rgba(139,92,246,0.35)] blur-3xl animate-float-glow" />
        <div className="absolute bottom-0 right-6 h-28 w-28 rounded-full bg-[rgba(240,171,252,0.2)] blur-2xl animate-float-glow" />
        <div className="relative z-10 space-y-6 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.12)] px-4 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-secondary)]">
            Cortex Mode · vNext
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-[var(--fg-primary)] sm:text-6xl">
            <span className="gradient-text">Your Personal AI Brain</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-[var(--fg-secondary)]">
            A persistent AI thinking partner that remembers everything you write, learns your
            style, and helps you think with a luminous memory graph.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="/chat"
              className="rounded-full border border-[rgba(139,92,246,0.35)] bg-[var(--accent)] px-6 py-2 text-sm font-medium text-white shadow-[var(--shadow-glow)] transition hover:bg-[var(--accent-hover)]"
            >
              Launch AI Workspace
            </a>
            <a
              href="/memories"
              className="rounded-full border border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.12)] px-6 py-2 text-sm font-medium text-[var(--fg-primary)] transition hover:bg-[rgba(139,92,246,0.2)]"
            >
              Explore Memory Vault
            </a>
          </div>
        </div>
      </section>

      <div className="glow-divider" />

      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/chat", title: "AI Chat", desc: "Streaming dialogue with contextual memory and citations." },
          { href: "/memories", title: "Memory Explorer", desc: "Semantic search, timelines, and memory tiers." },
          { href: "/graph", title: "Knowledge Graph", desc: "Relational view of concepts, people, and beliefs." },
          { href: "/writing", title: "Writing Studio", desc: "Rewrite, expand, and mimic your cognitive style." },
          { href: "/analytics", title: "Cognitive Insights", desc: "Trends, sentiment arcs, and focus analytics." },
        ].map(({ href, title, desc }) => (
          <a key={href} href={href} className="aurora-border">
            <div className="h-full rounded-[var(--radius-lg)] bg-[var(--bg-raised)]/80 p-6 transition hover:translate-y-[-2px] hover:shadow-[var(--shadow-glow)]">
              <h2 className="text-lg font-semibold text-[var(--fg-primary)]">{title}</h2>
              <p className="mt-2 text-sm text-[var(--fg-secondary)]">{desc}</p>
            </div>
          </a>
        ))}
      </section>
    </div>
  );
}
