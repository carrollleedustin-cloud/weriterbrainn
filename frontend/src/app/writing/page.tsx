"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { chatJson, recordPersonaSample } from "@/lib/api";
import { useNarrativeStore } from "@/store/narrative";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { NarrativeLens } from "@/components/nio/NarrativeLens";
import { DimensionHeader } from "@/components/nio/DimensionHeader";

export default function WritingPage() {
  const [text, setText] = useState("");
  const [flowMode, setFlowMode] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"improve" | "expand" | "rewrite" | null>(null);
  const [lensOpen, setLensOpen] = useState(false);

  const characters = useNarrativeStore((s) => s.characters);

  const charsInText = useMemo(() => {
    if (!text.trim() || characters.length === 0) return [];
    const lower = text.toLowerCase();
    return characters.filter((c) => lower.includes(c.name.toLowerCase()));
  }, [text, characters]);

  const energyLevel = useMemo(() => {
    const t = text.trim();
    if (!t) return 0;
    const words = t.split(/\s+/).length;
    const exclamations = (t.match(/!+/g) || []).length;
    const questions = (t.match(/\?/g) || []).length;
    return Math.min(100, Math.round((words / 50) * 20 + exclamations * 5 + questions * 3));
  }, [text]);

  const run = async (promptPrefix: string) => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setAction(
      promptPrefix.includes("improve") ? "improve" :
      promptPrefix.includes("expand") ? "expand" : "rewrite"
    );
    try {
      const message = `${promptPrefix} in the user's writing style:\n\n${text.trim()}`;
      const data = await chatJson(message);
      setSuggestion(data.response);
      await recordPersonaSample(text.trim());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
      setSuggestion("");
    } finally {
      setLoading(false);
      setAction(null);
    }
  };

  return (
    <div className={`space-y-6 ${flowMode ? "max-w-4xl mx-auto" : ""}`}>
      <div className={flowMode ? "opacity-30 hover:opacity-100 transition-opacity" : ""}>
        <DimensionHeader
          showDimensionNav={!flowMode}
          title={<>Living <span className="gradient-text">Forge</span></>}
          subtitle="Words tied to narrative objects. Continuity pressure, style DNA alignment, downstream consequence hints."
          stats={
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFlowMode(!flowMode)}
                title={flowMode ? "Exit flow mode" : "Enter flow mode — minimal UI"}
                className={`rounded-md px-3 py-1.5 text-xs ${flowMode ? "bg-[rgba(139,92,246,0.3)]" : "border border-[rgba(139,92,246,0.3)]"} text-[var(--fg-secondary)]`}
              >
                {flowMode ? "◎ Flow" : "Flow"}
              </button>
              <Link href="/analytics" className="rounded-full border border-[rgba(139,92,246,0.3)] px-3 py-1 text-xs text-[var(--fg-muted)] hover:text-[var(--fg-primary)]">Style DNA</Link>
              <div className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.12)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-secondary)]">
                Persona Sync
              </div>
            </div>
          }
        />
      </div>

      <div className={`grid gap-6 ${flowMode ? "grid-cols-1" : "lg:grid-cols-2"}`}>
        <div className="space-y-3 relative">
          {!flowMode && (
            <div className="space-y-2">
              <div className="cosmos-card rounded-lg p-3">
                <p className="text-xs text-[var(--fg-muted)] mb-1">Continuity pressure</p>
                <div className="flex gap-2 text-[10px]">
                  <span className="text-emerald-400">LOW</span>
                  <span className="text-[var(--fg-muted)]">Style DNA: 88%</span>
                  <span className="text-[var(--fg-muted)]">Downstream: 2 hints</span>
                </div>
              </div>
              <div className="cosmos-card rounded-lg p-3">
                <p className="text-xs text-[var(--fg-muted)] mb-1">Narrative energy</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(139,92,246,0.15)]">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(139,92,246,0.5),rgba(192,132,252,0.8))] transition-all" style={{ width: `${energyLevel}%` }} />
                </div>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">{energyLevel}%</p>
              </div>
              {charsInText.length > 0 && (
                <div className="cosmos-card rounded-lg p-3 flex flex-wrap gap-2">
                  <span className="text-xs text-[var(--fg-muted)]">Characters in scene:</span>
                  {charsInText.map((c) => (
                    <Link key={c.id} href={`/mindspace/${c.id}`} className="rounded-full bg-[rgba(139,92,246,0.2)] px-2 py-0.5 text-xs text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.3)] hover:shadow-[0_0_12px_rgba(139,92,246,0.3)]">
                      {c.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center justify-between">
            <label className="text-sm text-[var(--fg-muted)]">Your text</label>
            <div className="flex items-center gap-3">
              {charsInText.length > 0 && (
                <span className="text-[10px] uppercase tracking-wider text-[rgba(139,92,246,0.8)]">
                  {charsInText.length} object{charsInText.length !== 1 ? "s" : ""} in scene
                </span>
              )}
              <button
                type="button"
                onClick={() => setLensOpen(!lensOpen)}
                className={`text-[10px] uppercase tracking-wider ${lensOpen ? "text-[rgba(192,132,252,0.95)]" : "text-[var(--fg-muted)]"} hover:text-[var(--fg-primary)]`}
              >
                {lensOpen ? "◎ Lens on" : "Lens"}
              </button>
            </div>
          </div>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or write. Words tied to narrative objects will glow. Dialogue creates resonance."
            rows={14}
            className="min-h-[320px]"
          />
          {lensOpen && text.trim() && (
            <div className="cosmos-card animate-nio-bloom mt-2 rounded-lg border border-[rgba(139,92,246,0.25)] px-4 py-3">
              <p className="mb-2 text-[10px] uppercase tracking-wider text-[var(--fg-muted)]">
                Narrative lens — interactive terms
              </p>
              <NarrativeLens text={text} characters={characters} />
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => run("Improve this text for clarity and flow.")} disabled={loading || !text.trim()} variant="secondary">
              {loading && action === "improve" ? "..." : "Improve"}
            </Button>
            <Button onClick={() => run("Expand and elaborate on these ideas.")} disabled={loading || !text.trim()} variant="secondary">
              {loading && action === "expand" ? "..." : "Expand"}
            </Button>
            <Button onClick={() => run("Rewrite this text")} disabled={loading || !text.trim()} variant="secondary">
              {loading && action === "rewrite" ? "..." : "Rewrite"}
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm text-[var(--fg-muted)]">AI suggestion</label>
          <div className="min-h-[320px] rounded-[var(--radius-lg)] border border-[rgba(139,92,246,0.25)] bg-[var(--bg-overlay)]/70 px-4 py-3 text-[var(--fg-secondary)] shadow-[var(--shadow-sm)]">
            {loading && !suggestion ? (
              <span className="text-[var(--fg-muted)]">Thinking...</span>
            ) : suggestion ? (
              <div className="cursor-pointer whitespace-pre-wrap" onClick={() => navigator.clipboard.writeText(suggestion)}>
                {suggestion}
              </div>
            ) : (
              <span className="text-[var(--fg-muted)]">Result will appear here</span>
            )}
          </div>
          {suggestion && (
            <Button onClick={() => { setText(suggestion); setSuggestion(""); }} variant="ghost">
              Use this
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-[var(--radius-md)] border border-red-500/30 bg-red-500/10 p-2 text-red-300">
          {error}
        </div>
      )}
    </div>
  );
}
