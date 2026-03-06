export default function Home() {
  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-5xl">
          Your Personal AI Brain
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-zinc-400">
          A persistent AI thinking partner that remembers everything you write,
          learns your style, and helps you think.
        </p>
      </section>
      <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { href: "/chat", title: "AI Chat", desc: "Chat with your brain. Context-aware, streaming responses." },
          { href: "/memories", title: "Memory Explorer", desc: "Search and browse stored memories semantically." },
          { href: "/graph", title: "Knowledge Graph", desc: "Visualize ideas, people, and relationships." },
          { href: "/writing", title: "Writing Assistant", desc: "Improve text in your own style." },
          { href: "/analytics", title: "Analytics", desc: "Insights into your thinking patterns." },
        ].map(({ href, title, desc }) => (
          <a
            key={href}
            href={href}
            className="block rounded-xl border border-zinc-800 bg-zinc-900/50 p-6 transition hover:border-zinc-600 hover:bg-zinc-900"
          >
            <h2 className="text-lg font-semibold text-zinc-50">{title}</h2>
            <p className="mt-2 text-sm text-zinc-400">{desc}</p>
          </a>
        ))}
      </section>
    </div>
  );
}
