"use client";
import { useState } from "react";
import { getApiKey, setApiKey } from "@/lib/storage";

interface Props {
  onSave: (key: string) => void;
}

export default function ApiKeyModal({ onSave }: Props) {
  const [value, setValue] = useState(getApiKey());

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed.startsWith("sk-")) {
      alert("Enter a valid Anthropic API key (starts with sk-)");
      return;
    }
    setApiKey(trimmed);
    onSave(trimmed);
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.85)" }}>
      <div
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        className="rounded-lg p-8 max-w-md w-full mx-4"
      >
        <h2 className="text-xl font-bold mb-2">Anthropic API Key</h2>
        <p style={{ color: "var(--muted)" }} className="text-sm mb-6 leading-relaxed">
          Bookmoth uses your own Anthropic API key to generate text. Your key is stored locally in your browser and never sent to our servers.
        </p>
        <input
          type="password"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="sk-ant-..."
          style={{
            background: "var(--surface2)",
            border: "1px solid var(--border)",
            color: "var(--text)",
          }}
          className="w-full px-4 py-3 rounded text-sm mb-4 outline-none focus:border-amber-600"
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
        />
        <button
          onClick={handleSave}
          style={{ background: "var(--accent)", color: "#000" }}
          className="w-full py-3 rounded font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Save key & continue
        </button>
        <p style={{ color: "var(--muted)" }} className="text-xs mt-4 text-center">
          Get a key at console.anthropic.com
        </p>
      </div>
    </div>
  );
}
