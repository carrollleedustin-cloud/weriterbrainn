"use client";

import { useState } from "react";
import { chatJson, recordPersonaSample } from "@/lib/api";

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
      <h1 className="text-2xl font-semibold text-zinc-50">Writing Assistant</h1>
      <p className="text-zinc-400">
        Paste your text and use AI to improve, expand, or rewrite it. The assistant uses your persona metrics to match your style.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm text-zinc-400">Your text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste or write here..."
            rows={12}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 focus:border-zinc-500 focus:outline-none"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => run("Improve this text for clarity and flow.")}
              disabled={loading || !text.trim()}
              className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-600 disabled:opacity-50"
            >
              {loading && action === "improve" ? "..." : "Improve"}
            </button>
            <button
              onClick={() => run("Expand and elaborate on these ideas.")}
              disabled={loading || !text.trim()}
              className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-600 disabled:opacity-50"
            >
              {loading && action === "expand" ? "..." : "Expand"}
            </button>
            <button
              onClick={() => run("Rewrite this text")}
              disabled={loading || !text.trim()}
              className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-600 disabled:opacity-50"
            >
              {loading && action === "rewrite" ? "..." : "Rewrite"}
            </button>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm text-zinc-400">AI suggestion</label>
          <div className="min-h-[280px] rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-300">
            {loading && !suggestion ? (
              <span className="text-zinc-500">Thinking...</span>
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
              <span className="text-zinc-500">Result will appear here</span>
            )}
          </div>
          {suggestion && (
            <button
              onClick={() => {
                setText(suggestion);
                setSuggestion("");
              }}
              className="mt-2 rounded-lg bg-zinc-700 px-3 py-1.5 text-sm hover:bg-zinc-600"
            >
              Use this
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-900/30 p-2 text-red-400">{error}</div>
      )}
    </div>
  );
}
