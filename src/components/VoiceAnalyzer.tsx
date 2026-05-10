"use client";
import { useState } from "react";
import { VoiceProfile } from "@/lib/types";
import { getApiKey } from "@/lib/storage";

interface Props {
  initialSample: string;
  onComplete: (profile: VoiceProfile, sample: string) => void;
}

export default function VoiceAnalyzer({ initialSample, onComplete }: Props) {
  const [sample, setSample] = useState(initialSample);
  const [status, setStatus] = useState<"idle" | "analyzing" | "done" | "error">("idle");
  const [raw, setRaw] = useState("");

  async function analyze() {
    const apiKey = getApiKey();
    if (!apiKey) {
      alert("Set your Anthropic API key first.");
      return;
    }
    if (sample.trim().length < 100) {
      alert("Paste at least 100 characters of your writing.");
      return;
    }
    setStatus("analyzing");
    setRaw("");
    try {
      const res = await fetch("/api/analyze-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sampleText: sample, apiKey }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setRaw(text);
      }
      const profile: VoiceProfile = JSON.parse(text);
      profile.analyzedAt = new Date().toISOString();
      setStatus("done");
      onComplete(profile, sample);
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-2">Voice profile</h2>
      <p style={{ color: "var(--muted)" }} className="text-sm mb-6 leading-relaxed">
        Paste 500+ words of your prose. Bookmoth will map your sentence rhythms,
        vocabulary, dialogue patterns, and narrative tone into a reusable voice
        profile.
      </p>

      <textarea
        value={sample}
        onChange={(e) => setSample(e.target.value)}
        rows={14}
        placeholder="Paste your writing here…"
        style={{
          background: "var(--surface2)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          resize: "vertical",
          fontFamily: "Georgia, serif",
          lineHeight: "1.8",
        }}
        className="w-full px-5 py-4 rounded text-sm outline-none focus:border-amber-600 mb-4"
      />

      <div className="flex items-center gap-4">
        <button
          onClick={analyze}
          disabled={status === "analyzing"}
          style={{ background: "var(--accent)", color: "#000" }}
          className="px-6 py-2 rounded font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {status === "analyzing" ? "Analyzing…" : "Analyze my voice"}
        </button>
        <span style={{ color: "var(--muted)" }} className="text-xs">
          {sample.trim().split(/\s+/).filter(Boolean).length} words
        </span>
      </div>

      {status === "analyzing" && (
        <div style={{ color: "var(--muted)" }} className="mt-6 text-sm italic animate-pulse">
          Reading your prose…
        </div>
      )}

      {status === "error" && (
        <div className="mt-4 text-red-400 text-sm">
          Analysis failed. Check your API key and try again.
          {raw && <pre className="mt-2 text-xs opacity-60 overflow-auto">{raw}</pre>}
        </div>
      )}
    </div>
  );
}
