"use client";

import { useState } from "react";
import { chatJson, recordPersonaSample } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";

export default function WritingPage() {
  const [text, setText] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<"improve" | "expand" | "rewrite" | null>(null);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--fg-primary)]">Writing Studio</h1>
          <p className="text-[var(--fg-secondary)]">
            Imprint your voice. Expand, refine, or rewrite with your cognitive signature.
          </p>
        </div>
        <div className="rounded-full border border-[rgba(139,92,246,0.3)] bg-[rgba(139,92,246,0.12)] px-3 py-1 text-xs uppercase tracking-[0.2em] text-[var(--fg-secondary)]">
          Persona Sync
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
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
