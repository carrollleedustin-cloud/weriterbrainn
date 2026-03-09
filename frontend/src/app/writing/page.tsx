"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { chatJson, recordPersonaSample, getNarrativeCharacters } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

export default function WritingPage() {
  const [text, setText] = useState("");
  const [flowMode, setFlowMode] = useState(false);
  const [characters, setCharacters] = useState<Array<{ id: string; name: string }>>([]);
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"improve" | "expand" | "rewrite" | null>(null);

  useEffect(() => {
    getNarrativeCharacters().then((c) => setCharacters(Array.isArray(c) ? c : [])).catch(() => {});
  }, []);

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
    const raw = Math.min(100, Math.round((words / 50) * 20 + exclamations * 5 + questions * 3));
    return Math.min(100, raw);
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
      <div className={`flex items-center justify-between ${flowMode ? "opacity-30 hover:opacity-100 transition-opacity" : ""}`}>
        <div>
          <h1 className="text-2xl font-semibold text-[var(--fg-primary)]">Writing Studio</h1>
          <p className="text-[var(--fg-secondary)]">
            Imprint your voice. Expand, refine, or rewrite with your cognitive signature.
          </p>
        </div>
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
      </div>

      <div className={`grid gap-6 ${flowMode ? "grid-cols-1" : "lg:grid-cols-2"}`}>
        <div className="space-y-3 relative">
          {!flowMode && (
            <div className="space-y-2">
              <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-2">
                <p className="text-xs text-[var(--fg-muted)] mb-1">Narrative energy</p>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[rgba(139,92,246,0.15)]">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,rgba(139,92,246,0.5),rgba(192,132,252,0.8))] transition-all" style={{ width: `${energyLevel}%` }} />
                </div>
                <p className="text-xs text-[var(--fg-muted)] mt-0.5">{energyLevel}%</p>
              </div>
              {charsInText.length > 0 && (
            <div className="rounded-md border border-[rgba(139,92,246,0.2)] bg-[var(--bg-raised)]/80 p-3 flex flex-wrap gap-2">
              <span className="text-xs text-[var(--fg-muted)]">Characters in scene:</span>
              {charsInText.map((c) => (
                <Link key={c.id} href={`/cast?c=${c.id}`} className="rounded-full bg-[rgba(139,92,246,0.2)] px-2 py-0.5 text-xs text-[var(--fg-secondary)] hover:bg-[rgba(139,92,246,0.3)]">
                  {c.name}
                </Link>
              ))}
            </div>
              )}
            </div>
          )}
          <label className="text-sm text-[var(--fg-muted)]">Your text</label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or write here..."
            rows={14}
            className="min-h-[320px]"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => run("Improve this text for clarity and flow.")}
              disabled={loading || !text.trim()}
              variant="secondary"
            >
              {loading && action === "improve" ? "..." : "Improve"}
            </Button>
            <Button
              onClick={() => run("Expand and elaborate on these ideas.")}
              disabled={loading || !text.trim()}
              variant="secondary"
            >
              {loading && action === "expand" ? "..." : "Expand"}
            </Button>
            <Button
              onClick={() => run("Rewrite this text")}
              disabled={loading || !text.trim()}
              variant="secondary"
            >
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
              <div
                className="cursor-pointer whitespace-pre-wrap"
                onClick={() => {
                  navigator.clipboard.writeText(suggestion);
                }}
              >
                {suggestion}
              </div>
            ) : (
              <span className="text-[var(--fg-muted)]">Result will appear here</span>
            )}
          </div>
          {suggestion && (
            <Button
              onClick={() => {
                setText(suggestion);
                setSuggestion("");
              }}
              variant="ghost"
            >
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
