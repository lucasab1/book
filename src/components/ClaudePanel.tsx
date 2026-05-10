import { useState, useEffect, useRef } from "react";
import { api } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

const QUICK_COMMANDS = [
  { label: "/write", desc: "Draft prose for current chapter" },
  { label: "/critique", desc: "Get developmental feedback" },
  { label: "/brainstorm", desc: "Explore story ideas" },
  { label: "/ripple", desc: "Check character reactions" },
  { label: "/outline", desc: "Build or refine structure" },
  { label: "/continuity", desc: "Check against knowledge base" },
];

export default function ClaudePanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [installed, setInstalled] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    api.claudeCheckInstalled().then((ok) => setInstalled(!!ok));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || running) return;
    setInput("");
    setRunning(true);

    setMessages((prev) => [...prev, { role: "user", content: msg }]);

    // Add placeholder assistant message for streaming
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    const unsub = api.claudeOnChunk((chunk) => {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = { ...last, content: last.content + chunk };
        }
        return copy;
      });
    });

    await api.claudeRun(msg);
    unsub();

    // Mark streaming done
    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.role === "assistant") {
        copy[copy.length - 1] = { ...last, streaming: false };
      }
      return copy;
    });

    setRunning(false);
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)", width: 380, minWidth: 320 }}
      className="flex flex-col h-full">
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)" }} className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span style={{ color: "var(--accent)" }} className="text-sm font-bold">Claude</span>
          {installed === false && (
            <span style={{ color: "#c97e7e" }} className="text-xs">not installed</span>
          )}
          {installed === true && (
            <span style={{ color: "#7ec97e" }} className="text-xs">ready</span>
          )}
        </div>
        <button onClick={onClose} style={{ color: "var(--muted)" }} className="text-sm hover:opacity-80 px-1">✕</button>
      </div>

      {/* Quick commands */}
      {messages.length === 0 && (
        <div className="p-3 flex flex-col gap-1 overflow-y-auto">
          <p style={{ color: "var(--muted)" }} className="text-xs uppercase tracking-widest mb-2 px-1">Quick commands</p>
          {QUICK_COMMANDS.map((cmd) => (
            <button key={cmd.label} onClick={() => send(cmd.label)}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", textAlign: "left" }}
              className="rounded px-3 py-2 text-xs hover:border-amber-700 transition-colors">
              <span style={{ color: "var(--accent)" }} className="font-mono font-bold">{cmd.label}</span>
              <span style={{ color: "var(--muted)" }} className="ml-2">{cmd.desc}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      {messages.length > 0 && (
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              {m.role === "user" ? (
                <div style={{ background: "var(--accent)", color: "#000" }}
                  className="rounded-lg px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap">
                  {m.content}
                </div>
              ) : (
                <div style={{ color: "var(--text)" }} className="text-sm max-w-full whitespace-pre-wrap leading-relaxed font-mono">
                  {m.content}
                  {m.streaming && <span style={{ color: "var(--accent)" }} className="animate-pulse">▌</span>}
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div style={{ borderTop: "1px solid var(--border)" }} className="p-3">
        {installed === false ? (
          <div style={{ color: "#c97e7e" }} className="text-xs text-center py-2">
            Claude Code not found. Install it with: <code>npm install -g @anthropic-ai/claude-code</code>
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Message Claude… (Enter to send, Shift+Enter for newline)"
              rows={2}
              disabled={running}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", resize: "none" }}
              className="flex-1 px-3 py-2 rounded text-sm outline-none focus:border-amber-600 disabled:opacity-50"
            />
            <button onClick={() => send()} disabled={!input.trim() || running}
              style={{ background: running ? "var(--surface2)" : "var(--accent)", color: running ? "var(--muted)" : "#000" }}
              className="px-3 py-2 rounded text-sm font-bold shrink-0 disabled:opacity-50 self-end">
              {running ? "…" : "↑"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
