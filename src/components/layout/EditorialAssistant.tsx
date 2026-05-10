import { useRef, useState, useEffect } from "react";
import { Send, MoreHorizontal } from "lucide-react";
import { useAI } from "../../lib/context/AIContext";

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
          <pre key={i} className="bg-black/20 border border-white/5 rounded-xl p-4 text-[11px] my-3 font-mono overflow-x-auto">
            {lang && <span className="block text-[#c4a77d] text-[9px] uppercase font-black mb-2 tracking-widest">{lang}</span>}
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
          return <code key={j} className="bg-white/10 text-[#c4a77d] px-1.5 py-0.5 rounded text-[10px] font-mono">{part.slice(1, -1)}</code>;
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={j} className="text-white font-bold">{part.slice(2, -2)}</strong>;
        return part;
      });
      result.push(<span key={i} className="leading-relaxed block mb-1">{formatted}</span>);
    }
  }
  return result;
}

function PermissionBlock({ text, pid }: { text: string, pid?: number }) {
  const { sendInput } = useAI();
  if (!pid) return null;

  const isPermission = text.includes("Allow") || text.includes("permission") || text.includes("(y/n)");
  if (!isPermission) return null;

  return (
    <div className="mt-4 p-4 rounded-xl border border-[#c4a77d]/30 bg-[#c4a77d]/5 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2">
      <p className="text-[10px] font-black uppercase tracking-wider text-[#c4a77d]">Permission Requested</p>
      <div className="flex gap-2">
        <button 
          onClick={() => sendInput(pid, "y")}
          className="px-4 py-2 bg-[#c4a77d] text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-[#b3966a] transition-colors"
        >
          Allow (y)
        </button>
        <button 
          onClick={() => sendInput(pid, "n")}
          className="px-4 py-2 bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white/20 transition-colors"
        >
          Deny (n)
        </button>
      </div>
    </div>
  );
}

export default function EditorialAssistant() {
  const { messages, sendMessage, isBusy, currentProvider, setProvider, clearHistory, installed } = useAI();
  const [localInput, setLocalInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isBusy]);

  const handleSend = async () => {
    if (!localInput.trim() || isBusy) return;
    const msg = localInput;
    setLocalInput("");
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const providers: { id: "claude" | "gemini"; label: string }[] = [
    { id: "claude", label: "Claude" },
    { id: "gemini", label: "Gemini" }
  ];

  return (
    <aside className="w-[350px] flex flex-col shrink-0 text-[var(--text)] border-l border-[var(--border)]" style={{ background: "var(--surface)" }}>
      <header className="h-14 flex items-center justify-between px-6 border-b border-[var(--border)] shrink-0">
        <div className="flex items-center gap-3">
          {providers.map(p => {
            const active = currentProvider === p.id;
            const isInstalled = installed ? installed[p.id] : true;
            return (
              <button 
                key={p.id}
                onClick={() => setProvider(p.id)}
                disabled={!isInstalled && !!installed}
                className={`text-[10px] font-bold uppercase tracking-widest transition-all ${active ? 'text-[var(--accent)]' : 'text-[var(--text)]/40 hover:text-[var(--text)]'} ${(!isInstalled && !!installed) ? 'opacity-10 cursor-not-allowed grayscale' : ''}`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <button 
          onClick={clearHistory}
          className="text-[9px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
        >
          Clear
        </button>
      </header>

      {/* Chat Feed */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 px-8">
            <div className="w-12 h-12 rounded-full border border-[var(--text)]/20 flex items-center justify-center mb-4">
               <Send size={16} />
            </div>
            <p className="text-[11px] font-bold uppercase tracking-widest">Assistant Ready</p>
            <p className="text-[10px] mt-2 leading-relaxed">Ask for suggestions, critiques, or to draft the next scene.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-bold uppercase tracking-widest ${m.role === 'user' ? 'text-[var(--accent)]' : 'text-[var(--text)]/40'}`}>
                {m.role === 'user' ? 'You' : (m.provider || 'Editor')}
              </span>
              <div className={`w-1 h-1 rounded-full ${m.role === 'user' ? 'bg-[var(--accent)]' : 'bg-[var(--text)]/20'}`} />
            </div>
            
            <div className="flex flex-col gap-2">
              {m.thought && (
                <div className="text-[11px] text-[var(--text)]/40 italic bg-[var(--text)]/5 p-3 rounded-xl border border-[var(--border)] leading-relaxed">
                  <span className="block text-[8px] font-black uppercase tracking-widest mb-1 opacity-50 not-italic">Thought</span>
                  {m.thought}
                  {m.streaming && !m.content && <span className="inline-block w-1 h-3 bg-[var(--text)]/20 ml-1 animate-pulse align-middle" />}
                </div>
              )}
              
              {(m.content || (!m.thought && m.streaming)) && (
                <div className={`text-[12px] leading-relaxed p-4 rounded-2xl 
                  ${m.role === 'user' ? 'text-[var(--text)] font-medium bg-[var(--text)]/5' : ''}
                  ${m.role === 'assistant' && !m.error ? 'text-[var(--text)]/70' : ''}
                  ${m.error ? 'text-red-500 bg-red-500/5 border border-red-500/20' : ''}
                `}>
                  {m.streaming && !m.content && !m.thought ? (
                    <div className="flex gap-1.5 py-1">
                      <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                  ) : (
                    <>
                      {renderMarkdown(m.content)}
                      {m.streaming && <span className="inline-block w-1 h-3 bg-[var(--accent)] ml-1 animate-pulse align-middle" />}
                    </>
                  )}
                  <PermissionBlock text={m.content} pid={m.pid} />
                </div>
              )}
            </div>

            {!m.streaming && m.usage && (
               <div className="mt-2 flex gap-4 text-[8px] font-bold uppercase tracking-widest text-[var(--text)]/10">
                 <span>In: {m.usage.inputTokens}</span>
                 <span>Out: {m.usage.outputTokens}</span>
               </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Chat Input */}
      <div className="p-6 bg-[var(--surface)]">
        {installed && !installed[currentProvider] ? (
          <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 text-center">
             <p className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{currentProvider.toUpperCase()} CLI NOT FOUND</p>
             <p className="text-[9px] text-red-500/60 mt-1">Please install the {currentProvider} CLI to continue.</p>
          </div>
        ) : (
          <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 transition-all focus-within:border-[var(--accent)]/40 shadow-2xl">
            <textarea 
              ref={inputRef}
              value={localInput}
              onChange={(e) => setLocalInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask ${currentProvider}...`}
              disabled={isBusy}
              className="w-full bg-transparent border-none outline-none text-[12px] text-[var(--text)] placeholder:text-[var(--text)]/20 resize-none min-h-[60px] leading-relaxed disabled:opacity-50"
            />
            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2 opacity-20">
                <div className={`w-2 h-2 rounded-full ${isBusy ? 'bg-[var(--accent)] animate-pulse' : 'bg-[var(--text)]'}`} />
                <span className="text-[8px] font-bold uppercase tracking-widest text-[var(--text)]">{isBusy ? 'Processing...' : 'Context Active'}</span>
              </div>
              <button 
                onClick={handleSend}
                disabled={!localInput.trim() || isBusy}
                className="w-8 h-8 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center hover:scale-110 active:scale-90 transition-all disabled:opacity-20 disabled:grayscale"
              >
                {isBusy ? (
                  <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send size={14} />
                )}
              </button>
            </div>
          </div>
        )}
        <p className="text-center text-[8px] font-bold text-[var(--text)]/10 uppercase tracking-[0.2em] mt-4">
          Powered by {currentProvider.toUpperCase()}
        </p>
      </div>
    </aside>
  );
}
