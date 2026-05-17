import { useRef, useState, useEffect, useCallback } from "react";
import { Send, ChevronRight, X, RotateCcw } from "lucide-react";
import { useAI } from "../../lib/context/AIContext";

// Strip ANSI escape codes and token-usage lines from CLI output
function cleanText(text: string) {
  return text
    .replace(/\[\d*[a-zA-Z]/g, "")
    .replace(/\r/g, "")
    .replace(/Tokens: [\d,]+ input, [\d,]+ output[\s\S]*$/m, "")
    .trim();
}

function renderMarkdown(raw: string) {
  const text = cleanText(raw);
  const lines = text.split("\n");
  const result: React.ReactNode[] = [];
  let inCode = false;
  let codeLines: string[] = [];
  let lang = "";
  let key = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("```")) {
      if (!inCode) {
        inCode = true;
        lang = line.slice(3).trim();
        codeLines = [];
      } else {
        result.push(
          <pre key={key++} className="my-3 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)", padding: "12px 14px" }}>
            {lang && <span style={{ color: "var(--accent)", opacity: 0.7 }} className="block text-[9px] uppercase font-black mb-2 tracking-widest">{lang}</span>}
            {codeLines.join("\n")}
          </pre>
        );
        inCode = false; codeLines = []; lang = "";
      }
    } else if (inCode) {
      codeLines.push(line);
    } else {
      if (!line.trim() && i > 0) { result.push(<br key={key++} />); continue; }
      const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*|#{1,3} .+)/g);
      const formatted = parts.map((part, j) => {
        if (part.match(/^#{1,3} /)) return <strong key={j} className="block text-sm font-bold mt-3 mb-1" style={{ color: "var(--text)" }}>{part.replace(/^#{1,3} /, "")}</strong>;
        if (part.startsWith("`") && part.endsWith("`")) return <code key={j} className="px-1.5 py-0.5 rounded text-[11px] font-mono" style={{ background: "var(--surface2)", color: "var(--accent)" }}>{part.slice(1, -1)}</code>;
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={j} style={{ color: "var(--text)" }}>{part.slice(2, -2)}</strong>;
        return part;
      });
      result.push(<span key={key++} className="block leading-relaxed">{formatted}</span>);
    }
  }
  return result;
}

function PermissionPrompt({ text, pid }: { text: string; pid?: number }) {
  const { sendInput } = useAI();
  if (!pid) return null;
  const needs = /Allow|permission|\(y\/n\)|Do you want/i.test(text);
  if (!needs) return null;
  return (
    <div className="mt-3 flex gap-2">
      <button onClick={() => sendInput(pid, "y")}
        style={{ background: "var(--accent)", color: "#000" }}
        className="px-4 py-1.5 rounded-lg text-xs font-bold">Allow</button>
      <button onClick={() => sendInput(pid, "n")}
        style={{ border: "1px solid var(--border)", color: "var(--muted)" }}
        className="px-4 py-1.5 rounded-lg text-xs font-bold">Deny</button>
    </div>
  );
}

const MIN_WIDTH = 340;
const MAX_WIDTH = 900;
const DEFAULT_WIDTH = 480;

export default function EditorialAssistant() {
  const { messages, sendMessage, isBusy, currentProvider, setProvider, clearHistory, installed, isPanelOpen, setPanelOpen } = useAI();
  const [input, setInput] = useState("");
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const resizing = useRef(false);
  const resizeStartX = useRef(0);
  const resizeStartW = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBusy]);

  // Resize drag
  const onResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizing.current = true;
    resizeStartX.current = e.clientX;
    resizeStartW.current = width;

    const onMove = (ev: MouseEvent) => {
      if (!resizing.current) return;
      const delta = resizeStartX.current - ev.clientX;
      setWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, resizeStartW.current + delta)));
    };
    const onUp = () => {
      resizing.current = false;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [width]);

  async function handleSend() {
    const msg = input.trim();
    if (!msg || isBusy) return;
    setInput("");
    await sendMessage(msg);
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  // Auto-grow textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  }

  // Collapsed state — thin strip on the right
  if (!isPanelOpen) {
    return (
      <div style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)", width: 44 }}
        className="flex flex-col items-center py-4 shrink-0">
        <button onClick={() => setPanelOpen(true)} title="Open assistant"
          style={{ color: "var(--muted)" }}
          className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity">
          <ChevronRight size={16} />
          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ writingMode: "vertical-rl", color: "var(--muted)" }}>
            {currentProvider === "gemini" ? "Gemini" : "Claude"}
          </span>
        </button>
      </div>
    );
  }

  const providerColor = currentProvider === "gemini" ? "#3b82f6" : "#d97706";

  return (
    <div style={{ width, background: "var(--surface)", borderLeft: "1px solid var(--border)" }}
      className="flex shrink-0 h-full">

      {/* Drag handle */}
      <div
        onMouseDown={onResizeStart}
        className="w-1 h-full cursor-col-resize hover:bg-[var(--accent)]/30 transition-colors shrink-0"
        style={{ background: "var(--border)" }}
      />

      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)" }}
          className="h-12 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-1">
            {(["claude", "gemini"] as const).map((p) => {
              const active = currentProvider === p;
              const ok = installed ? installed[p] : true;
              return (
                <button key={p} onClick={() => setProvider(p)} disabled={!ok && !!installed}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
                  style={{
                    background: active ? "var(--text)" : "transparent",
                    color: active ? "var(--bg)" : "var(--muted)",
                    opacity: (!ok && !!installed) ? 0.3 : 1,
                  }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: active ? providerColor : "currentColor", opacity: active ? 1 : 0.3 }} />
                  {p}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button onClick={clearHistory} title="Clear chat" style={{ color: "var(--muted)" }}
                className="hover:opacity-80 transition-opacity p-1">
                <RotateCcw size={13} />
              </button>
            )}
            <button onClick={() => setPanelOpen(false)} title="Minimize" style={{ color: "var(--muted)" }}
              className="hover:opacity-80 transition-opacity p-1">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center px-6 opacity-30">
              <div className="w-10 h-10 rounded-full border mb-4 flex items-center justify-center"
                style={{ borderColor: "var(--border)" }}>
                <Send size={14} />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest">Assistant ready</p>
              <p className="text-[11px] mt-2 leading-relaxed">
                Ask for suggestions, critiques, or use /write, /critique, /brainstorm
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
                  style={{ background: m.provider === "gemini" ? "#3b82f620" : "#d9770620", color: m.provider === "gemini" ? "#3b82f6" : "#d97706", border: `1px solid ${m.provider === "gemini" ? "#3b82f630" : "#d9770630"}` }}>
                  {m.provider === "gemini" ? "G" : "C"}
                </div>
              )}
              <div className={`max-w-[85%] ${m.role === "user" ? "order-first" : ""}`}>
                {m.role === "user" ? (
                  <div className="px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed"
                    style={{ background: "var(--accent)", color: "#000" }}>
                    {m.content}
                  </div>
                ) : (
                  <div>
                    {m.thought && (
                      <div className="mb-2 px-3 py-2 rounded-xl text-[11px] leading-relaxed italic opacity-50"
                        style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                        <span className="block text-[9px] not-italic font-bold uppercase tracking-widest mb-1">Thinking</span>
                        {m.thought}
                      </div>
                    )}
                    <div className={`text-[13px] leading-relaxed rounded-2xl rounded-tl-sm px-4 py-3
                      ${m.error ? "border border-red-500/30 text-red-400" : ""}`}
                      style={{ background: m.error ? "rgba(239,68,68,0.05)" : "var(--surface2)", color: m.error ? undefined : "var(--text)" }}>
                      {m.streaming && !m.content && !m.thought ? (
                        <div className="flex gap-1 py-1">
                          {[0, 0.15, 0.3].map((d, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                              style={{ background: "var(--accent)", animationDelay: `${d}s` }} />
                          ))}
                        </div>
                      ) : (
                        <>
                          {renderMarkdown(m.content)}
                          {m.streaming && (
                            <span className="inline-block w-0.5 h-4 ml-0.5 animate-pulse align-middle rounded"
                              style={{ background: "var(--accent)" }} />
                          )}
                        </>
                      )}
                      <PermissionPrompt text={m.content} pid={m.pid} />
                    </div>
                    {!m.streaming && m.usage && (
                      <div className="mt-1 flex gap-3 text-[9px] font-mono opacity-20 px-1">
                        <span>{m.usage.inputTokens?.toLocaleString()} in</span>
                        <span>{m.usage.outputTokens?.toLocaleString()} out</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold"
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)" }}>
                  U
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ borderTop: "1px solid var(--border)" }} className="p-4 shrink-0">
          {installed && !installed[currentProvider] ? (
            <div className="rounded-xl p-3 text-center text-xs" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)", color: "rgb(239,68,68)" }}>
              {currentProvider === "claude"
                ? "Install Claude Code: npm i -g @anthropic-ai/claude-code"
                : "Install Gemini CLI: npm i -g @google/gemini-cli"}
            </div>
          ) : (
            <div className="rounded-2xl p-3 transition-all"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}
              onFocus={() => {}} // keep border update on focus via CSS below
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleInput}
                onKeyDown={handleKey}
                placeholder={`Ask ${currentProvider === "gemini" ? "Gemini" : "Claude"}… (Enter to send, Shift+Enter for newline)`}
                disabled={isBusy}
                rows={2}
                className="w-full bg-transparent border-none outline-none text-sm leading-relaxed disabled:opacity-50 resize-none"
                style={{ color: "var(--text)", minHeight: 44, maxHeight: 160 }}
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-20"
                  style={{ color: "var(--text)" }}>
                  {isBusy ? "Thinking…" : "Ready"}
                </span>
                <button onClick={handleSend} disabled={!input.trim() || isBusy}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-30"
                  style={{ background: "var(--accent)", color: "#000" }}>
                  {isBusy
                    ? <div className="w-3 h-3 rounded-full border-2 border-black/20 border-t-black animate-spin" />
                    : <Send size={13} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
