import { useEffect, useRef, useState } from "react";
import { useAI, AIProviderID, Message } from "../lib/context/AIContext";
import { Paperclip } from "lucide-react";

const PROVIDERS: { id: AIProviderID; label: string; color: string }[] = [
  { id: "claude", label: "Claude", color: "#d97706" },
  { id: "gemini", label: "Gemini", color: "#3b82f6" },
];

function PermissionBlock({ text, pid }: { text: string, pid?: number }) {
  const { sendInput } = useAI();
  if (!pid) return null;

  const isPermission = text.includes("Allow") || text.includes("permission") || text.includes("(y/n)");
  if (!isPermission) return null;

  return (
    <div className="mt-4 p-4 rounded-xl border border-accent bg-accent/5 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-accent">Permission Requested</p>
      <div className="flex gap-2">
        <button 
          onClick={() => sendInput(pid, "y")}
          className="px-4 py-2 bg-accent text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-accent-dim transition-colors"
        >
          Allow (y)
        </button>
        <button 
          onClick={() => sendInput(pid, "n")}
          className="px-4 py-2 bg-surface2 text-muted text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-surface3 transition-colors"
        >
          Deny (n)
        </button>
      </div>
    </div>
  );
}

function renderMarkdown(text: string) {
  const cleanText = text
    .replace(/\u001b\[\d+m/g, "")
    .replace(/Tokens: [\d,]+ input, [\d,]+ output/g, "")
    .trim();

  const lines = cleanText.split("\n");
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
          <pre key={i} style={{ background: "var(--bg)", border: "1px solid var(--border)", overflowX: "auto" }}
            className="rounded-xl p-4 text-[11px] my-3 font-mono shadow-inner">
            {lang && <span className="block text-accent/50 text-[9px] uppercase font-black mb-2 tracking-widest">{lang}</span>}
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
      const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
      const formatted = parts.map((part, j) => {
        if (part.startsWith("`") && part.endsWith("`"))
          return <code key={j} className="bg-surface2 text-accent px-1.5 py-0.5 rounded text-[10px] font-mono border border-border">{part.slice(1, -1)}</code>;
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={j} className="text-text font-bold">{part.slice(2, -2)}</strong>;
        return part;
      });
      result.push(<span key={i} className="leading-relaxed block mb-1">{formatted}</span>);
    }
  }
  return result;
}

export default function ClaudePanel() {
  const {
    messages, currentProvider, isBusy, installed,
    sendMessage, setPanelOpen, setProvider, clearHistory
  } = useAI();

  const [localInput, setLocalInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSend = async (text?: string) => {
    const val = text ?? localInput;
    if (!val.trim() || isBusy) return;
    if (!text) setLocalInput("");
    await sendMessage(val);
    inputRef.current?.focus();
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); onSend(); }
  };

  const activeInstalled = installed ? installed[currentProvider] : null;

  return (
    <div style={{ background: "var(--surface)", borderLeft: "1px solid var(--border)", width: 420, minWidth: 380 }}
      className="flex flex-col h-full shrink-0 shadow-2xl z-50">

      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)" }} className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-1.5">
          {PROVIDERS.map((p) => {
            const active = currentProvider === p.id;
            return (
              <button key={p.id} onClick={() => setProvider(p.id)}
                style={{
                  color: active ? "var(--text)" : "var(--muted)",
                  borderBottom: active ? "2px solid var(--accent)" : "2px solid transparent",
                }}
                className="text-[10px] uppercase tracking-widest px-3 py-1 font-black transition-all hover:text-text">
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={clearHistory} className="text-[10px] uppercase font-black text-muted hover:text-text transition-colors">Clear</button>
          <button onClick={() => setPanelOpen(false)} className="text-muted hover:text-text">✕</button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
            <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-text mb-2">Assistant</h3>
            <p className="text-[11px] text-muted max-w-[200px] leading-relaxed">
              Connected to local {currentProvider === "claude" ? "Claude Code" : "Gemini CLI"}.
            </p>
          </div>
        )}
        
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex flex-col"}>
            {m.role === "user" ? (
              <div style={{ background: "#fff", border: "1px solid var(--border)" }}
                className="rounded-xl px-4 py-2 text-[12px] max-w-[90%] whitespace-pre-wrap leading-relaxed shadow-sm text-text font-medium">
                {m.content}
              </div>
            ) : (
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                   <div className={`w-1 h-1 rounded-full ${m.provider === 'gemini' ? 'bg-blue-400' : 'bg-accent'}`}></div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-muted">{m.provider}</span>
                </div>
                
                <div className="flex flex-col gap-3">
                  {m.thought && (
                    <div className="text-[11px] text-muted italic bg-surface2/30 p-3 rounded-xl border border-border/50 leading-relaxed">
                      <span className="block text-[8px] font-black uppercase tracking-widest mb-1 opacity-50 not-italic">Thought Process</span>
                      {m.thought}
                      {m.streaming && !m.content && <span className="inline-block w-1 h-3 bg-accent/20 ml-1 animate-pulse align-middle" />}
                    </div>
                  )}

                  <div className="text-[12px] text-text/90">
                    {m.streaming && m.content === "" && !m.thought ? (
                      <div className="flex gap-1 items-center">
                        <div className="w-1 h-1 bg-accent rounded-full animate-bounce"></div>
                        <div className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:0.2s]"></div>
                        <div className="w-1 h-1 bg-accent rounded-full animate-bounce [animation-delay:0.4s]"></div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-1">
                          {renderMarkdown(m.content)}
                        </div>
                        {m.streaming && <span className="inline-block w-1 h-3 bg-accent ml-1 animate-pulse align-middle"></span>}
                        <PermissionBlock text={m.content} pid={m.pid} />
                      </>
                    )}
                  </div>
                </div>

                {!m.streaming && m.usage && (
                   <div className="mt-4 pt-4 border-t border-border flex gap-4 text-[9px] font-black uppercase tracking-widest text-muted/40">
                     <span>Input: {m.usage.inputTokens}</span>
                     <span>Output: {m.usage.outputTokens}</span>
                   </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-6">
        {activeInstalled === false ? (
          <div className="text-[10px] text-red-500 font-bold uppercase tracking-widest">CLI NOT FOUND</div>
        ) : (
          <div className="relative">
            <button 
              onClick={() => {
                setLocalInput(prev => prev + (prev.endsWith(" ") || !prev ? "" : " ") + "@");
                inputRef.current?.focus();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded flex items-center justify-center text-muted hover:text-accent z-10 transition-colors"
              title="Attach Entity / File"
            >
              <Paperclip size={14} />
            </button>
            <textarea
              ref={inputRef}
              value={localInput}
              onChange={(e) => {
                setLocalInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
              }}
              onKeyDown={handleKey}
              placeholder={`Ask ${currentProvider === "claude" ? "Claude" : "Gemini"}...`}
              rows={1}
              disabled={isBusy}
              style={{ background: "#fff", border: "1px solid var(--border)" }}
              className="w-full pl-10 pr-12 py-3 rounded-xl text-[12px] outline-none focus:border-accent shadow-sm transition-all disabled:opacity-50"
            />
            <button 
              onClick={() => onSend()} 
              disabled={!localInput.trim() || isBusy}
              className="absolute right-2 bottom-2 w-8 h-8 rounded-lg flex items-center justify-center text-accent disabled:opacity-20"
            >
              {isBusy ? (
                <div className="w-4 h-4 border-2 border-accent/20 border-t-accent rounded-full animate-spin" />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
