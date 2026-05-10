import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "../lib/api";

type Provider = "claude" | "gemini";

interface Message {
  role: "user" | "assistant";
  content: string;
  provider?: Provider;
  streaming?: boolean;
  error?: boolean;
}

const PROVIDERS: { id: Provider; label: string; color: string }[] = [
  { id: "claude", label: "Claude", color: "#d97706" },
  { id: "gemini", label: "Gemini", color: "#3b82f6" },
];

// Slash commands only make sense for Claude Code (which reads CLAUDE.md + skills)
const QUICK_COMMANDS = [
  { label: "/write", desc: "Draft prose for current chapter" },
  { label: "/critique", desc: "Developmental feedback" },
  { label: "/brainstorm", desc: "Explore story ideas" },
  { label: "/ripple", desc: "Check character reactions" },
  { label: "/outline", desc: "Story structure" },
  { label: "/continuity", desc: "Check against KB" },
];

// Build a context-aware prompt that includes conversation history.
// For slash commands (Claude), send as-is — Claude Code handles its own context.
function buildPrompt(history: Message[], newMsg: string): string {
  const isSlashCmd = newMsg.trim().startsWith("/");
  if (isSlashCmd || history.length === 0) return newMsg;
  const recent = history.slice(-6); // last 3 turns
  const ctx = recent
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content.trim()}`)
    .join("\n\n");
  return `${ctx}\n\nUser: ${newMsg}`;
}

// Very basic markdown → rendered: bold, code blocks, inline code, line breaks
function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let lang = "";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        lang = line.slice(3).trim();
        codeLines = [];
      } else {
        result.push(
          <pre key={i} style={{ background: "var(--surface2)", border: "1px solid var(--border)", overflowX: "auto" }}
            className="rounded p-3 text-xs my-2 font-mono">
            {lang && <span style={{ color: "var(--muted)" }} className="block text-xs mb-1">{lang}</span>}
            {codeLines.join("\n")}
          </pre>
        );
        inCode = false;
        codeLines = [];
        lang = "";
      }
    } else if (inCode) {
      codeLines.push(line);
    } else {
      // Inline formatting
      const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
      const formatted = parts.map((part, j) => {
        if (part.startsWith("`") && part.endsWith("`"))
          return <code key={j} style={{ background: "var(--surface2)", color: "var(--accent)" }} className="px-1 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={j}>{part.slice(2, -2)}</strong>;
        return part;
      });
      result.push(<span key={i}>{formatted}{i < lines.length - 1 ? <br /> : null}</span>);
    }
  }
  return result;
}

export default function ClaudePanel({ onClose }: { onClose: () => void }) {
  const [provider, setProvider] = useState<Provider>("claude");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [running, setRunning] = useState(false);
  const [installed, setInstalled] = useState<{ claude: boolean; gemini: boolean } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  useEffect(() => {
    api.aiCheckInstalled().then((r) => {
      if (r) {
        setInstalled(r);
        if (!r.claude && r.gemini) setProvider("gemini");
      }
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async (text?: string) => {
    const raw = (text ?? input).trim();
    if (!raw || running) return;
    setInput("");
    setRunning(true);

    const userMsg: Message = { role: "user", content: raw };
    const assistantMsg: Message = { role: "assistant", content: "", provider, streaming: true };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    const prompt = buildPrompt([...messagesRef.current, userMsg], raw);

    const unsub = api.aiOnChunk((chunk) => {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.streaming) copy[copy.length - 1] = { ...last, content: last.content + chunk };
        return copy;
      });
    });

    const result = await api.aiRun(provider, prompt);
    unsub();

    setMessages((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last?.streaming) {
        copy[copy.length - 1] = {
          ...last,
          streaming: false,
          error: !!result?.error,
          content: result?.error ? result.error : last.content,
        };
      }
      return copy;
    });

    setRunning(false);
    inputRef.current?.focus();
  }, [input, running, provider]);

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const activeInstalled = installed ? installed[provider] : null;

  return (
    <div style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)", width: 400, minWidth: 340 }}
      className="flex flex-col h-full shrink-0">

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)" }} className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-1">
          {PROVIDERS.map((p) => {
            const avail = installed ? installed[p.id] : null;
            const active = provider === p.id;
            return (
              <button key={p.id} onClick={() => setProvider(p.id)}
                style={{
                  color: active ? p.color : "var(--muted)",
                  background: active ? "var(--surface2)" : "transparent",
                  border: active ? `1px solid ${p.color}40` : "1px solid transparent",
                  opacity: avail === false ? 0.4 : 1,
                }}
                className="text-xs px-3 py-1 rounded font-bold transition-all">
                {p.label}
                {avail === true && active && <span style={{ color: "#7ec97e" }} className="ml-1">●</span>}
                {avail === false && <span style={{ color: "#c97e7e" }} className="ml-1">✕</span>}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button onClick={() => setMessages([])}
              style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
              className="text-xs px-2 py-0.5 rounded hover:opacity-80">New chat</button>
          )}
          <button onClick={onClose} style={{ color: "var(--muted)" }} className="text-sm hover:opacity-80 px-1">✕</button>
        </div>
      </div>

      {/* Quick commands — shown as chips below header when chat is empty */}
      {messages.length === 0 && provider === "claude" && (
        <div style={{ borderBottom: "1px solid var(--border)" }} className="px-3 py-3">
          <p style={{ color: "var(--muted)" }} className="text-xs uppercase tracking-widest mb-2">Claude Code commands</p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_COMMANDS.map((cmd) => (
              <button key={cmd.label} onClick={() => send(cmd.label)}
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", textAlign: "left" }}
                className="rounded px-2.5 py-2 text-xs hover:border-amber-700 transition-colors">
                <div style={{ color: "#d97706" }} className="font-mono font-bold">{cmd.label}</div>
                <div style={{ color: "var(--muted)" }} className="text-xs leading-tight mt-0.5">{cmd.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.length === 0 && provider === "gemini" && (
        <div style={{ borderBottom: "1px solid var(--border)" }} className="px-3 py-3">
          <p style={{ color: "var(--muted)" }} className="text-xs mb-2">Ask Gemini anything about your project — brainstorming, feedback, lore questions.</p>
          <div className="flex flex-wrap gap-1.5">
            {["Give me plot ideas", "Brainstorm chapter ideas", "Suggest character arc", "Check story consistency"].map((q) => (
              <button key={q} onClick={() => send(q)}
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)" }}
                className="text-xs px-2.5 py-1.5 rounded hover:opacity-80">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex gap-2"}>
            {m.role === "user" ? (
              <div style={{ background: "var(--accent)", color: "#000" }}
                className="rounded-2xl rounded-tr-sm px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap leading-relaxed">
                {m.content}
              </div>
            ) : (
              <div className="flex-1 min-w-0">
                <div style={{
                  color: m.error ? "#c97e7e" : "var(--text)",
                  borderLeft: `2px solid ${m.provider === "gemini" ? "#3b82f640" : "#d9770640"}`,
                }} className="pl-3 text-sm leading-relaxed">
                  {m.streaming && m.content === "" ? (
                    <span style={{ color: "var(--muted)" }} className="animate-pulse">thinking…</span>
                  ) : (
                    <>
                      {renderMarkdown(m.content)}
                      {m.streaming && <span style={{ color: m.provider === "gemini" ? "#3b82f6" : "#d97706" }} className="animate-pulse">▌</span>}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ borderTop: "1px solid var(--border)" }} className="p-3">
        {activeInstalled === false ? (
          <div style={{ color: "#c97e7e", background: "var(--surface2)" }} className="rounded p-3 text-xs leading-relaxed">
            {provider === "claude"
              ? <>Claude Code not found. Install: <code>npm i -g @anthropic-ai/claude-code</code></>
              : <>Gemini CLI not found. Install: <code>npm i -g @google/gemini-cli</code></>}
          </div>
        ) : (
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKey}
              placeholder={provider === "claude" ? "Message Claude… (/write, /critique, /brainstorm…)" : "Ask Gemini…"}
              rows={2}
              disabled={running}
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", resize: "none", minHeight: 44 }}
              className="flex-1 px-3 py-2.5 rounded-lg text-sm outline-none focus:border-amber-600 disabled:opacity-50"
            />
            <button onClick={() => send()} disabled={!input.trim() || running}
              style={{
                background: running ? "var(--surface2)" : (provider === "gemini" ? "#3b82f6" : "var(--accent)"),
                color: running ? "var(--muted)" : "#000",
              }}
              className="w-9 h-9 rounded-lg text-sm font-bold shrink-0 disabled:opacity-40 flex items-center justify-center self-end">
              {running ? "…" : "↑"}
            </button>
          </div>
        )}
        <p style={{ color: "var(--muted)" }} className="text-xs mt-1.5 text-right">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}
