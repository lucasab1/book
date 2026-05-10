import { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from "react";
import { api } from "../api";

export type AIProviderID = "claude" | "gemini";

export interface Message {
  role: "user" | "assistant";
  content: string;
  thought?: string; // Internal reasoning
  provider?: AIProviderID;
  streaming?: boolean;
  error?: boolean;
  pid?: number;
  progress?: number; // 0 to 100
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
}

interface AIContextType {
  messages: Message[];
  isPanelOpen: boolean;
  currentProvider: AIProviderID;
  isBusy: boolean;
  installed: { claude: boolean; gemini: boolean } | null;
  sendMessage: (content: string) => Promise<void>;
  sendInput: (pid: number, text: string) => void;
  setPanelOpen: (open: boolean) => void;
  setProvider: (provider: AIProviderID) => void;
  clearHistory: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

function extractClaudeUsage(text: string) {
  const usageMatch = text.match(/Tokens: ([\d,]+) input, ([\d,]+) output/);
  if (usageMatch) {
    return {
      inputTokens: parseInt(usageMatch[1].replace(/,/g, "")),
      outputTokens: parseInt(usageMatch[2].replace(/,/g, "")),
    };
  }
  return null;
}

/**
 * Parsers content to separate thoughts from final answer.
 * Handles partial tags during streaming.
 */
function parseContent(raw: string) {
  let content = raw;
  let thought = "";

  // 1. Handle <thought> tags (standard for Claude Code)
  if (raw.includes("<thought>")) {
    const endTag = "</thought>";
    const endIndex = raw.indexOf(endTag);
    
    if (endIndex !== -1) {
      // Complete tag
      thought = raw.substring(raw.indexOf("<thought>") + 9, endIndex).trim();
      content = (raw.substring(0, raw.indexOf("<thought>")) + raw.substring(endIndex + 10)).trim();
    } else {
      // Partial tag (still thinking)
      thought = raw.substring(raw.indexOf("<thought>") + 9).trim();
      content = raw.substring(0, raw.indexOf("<thought>")).trim();
    }
  } 
  // 2. Handle markdown headers or specific markers
  else {
    const thinkingMatch = raw.match(/^(?:Thinking|Reasoning|Thought):([\s\S]*?)(?:\n\n|#|$)/i);
    if (thinkingMatch) {
       thought = thinkingMatch[1];
       content = raw.replace(/^(?:Thinking|Reasoning|Thought):[\s\S]*?(?:\n\n|#|$)/i, "").trim();
    }
  }

  return { content, thought };
}

export function AIProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem("bookmoth_ai_messages");
    return saved ? JSON.parse(saved) : [];
  });
  const [isPanelOpen, setPanelOpen] = useState(() => {
    return localStorage.getItem("bookmoth_ai_panel_open") === "true";
  });
  const [currentProvider, setProvider] = useState<AIProviderID>(() => {
    return (localStorage.getItem("bookmoth_ai_provider") as AIProviderID) || "claude";
  });
  
  const [isBusy, setIsBusy] = useState(false);
  const [installed, setInstalled] = useState<{ claude: boolean; gemini: boolean } | null>(null);

  const messagesRef = useRef<Message[]>([]);
  messagesRef.current = messages;

  useEffect(() => { localStorage.setItem("bookmoth_ai_messages", JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem("bookmoth_ai_panel_open", String(isPanelOpen)); }, [isPanelOpen]);
  useEffect(() => { localStorage.setItem("bookmoth_ai_provider", currentProvider); }, [currentProvider]);

  useEffect(() => {
    api.aiCheckInstalled().then((r) => {
      if (r) {
        setInstalled(r);
        if (!r.claude && r.gemini && !localStorage.getItem("bookmoth_ai_provider")) setProvider("gemini");
      }
    });
  }, []);

  const sendInput = useCallback((pid: number, text: string) => {
    api.aiSendInput(pid, text);
    setMessages(prev => [...prev, { role: "user", content: text }]);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    const raw = content.trim();
    if (!raw || isBusy) return;

    setIsBusy(true);
    setPanelOpen(true);

    const userMsg: Message = { role: "user", content: raw };
    const assistantMsg: Message = { role: "assistant", content: "", provider: currentProvider, streaming: true, progress: 5 };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);

    let activePid: number | undefined;
    const unsubStart = api.aiOnStart((data) => {
      activePid = data.pid;
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last) copy[copy.length - 1] = { ...last, pid: data.pid, progress: 15 };
        return copy;
      });
    });

    const unsubChunk = api.aiOnChunk((chunk) => {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.streaming) {
          const rawTotal = last.content + chunk;
          const { content: cleanContent, thought } = parseContent(rawTotal);
          const usage = extractClaudeUsage(rawTotal);
          
          // Estimate progress based on length or specific markers
          let progress = Math.min(95, (last.progress || 15) + (chunk.length > 0 ? 0.5 : 0));
          if (usage) progress = 100;

          copy[copy.length - 1] = { 
            ...last, 
            content: cleanContent || (thought ? "" : ""), 
            thought,
            usage: usage || last.usage,
            progress
          };
        }
        return copy;
      });
    });

    try {
      const result = await api.aiRun(currentProvider, raw);
      unsubStart();
      unsubChunk();

      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.streaming) {
          const finalRaw = result?.output || last.content;
          const { content: finalContent, thought: finalThought } = parseContent(finalRaw);
          const usage = extractClaudeUsage(finalRaw);
          
          copy[copy.length - 1] = {
            ...last,
            streaming: false,
            error: !!result?.error,
            content: result?.error || finalContent,
            thought: finalThought,
            usage: usage || last.usage,
            progress: 100
          };
        }
        return copy;
      });
    } catch (err) {
      unsubStart();
      unsubChunk();
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last) {
          copy[copy.length - 1] = {
            ...last,
            streaming: false,
            error: true,
            content: err instanceof Error ? err.message : "An unexpected error occurred",
            progress: 0
          };
        }
        return copy;
      });
    } finally {
      setIsBusy(false);
    }
  }, [currentProvider, isBusy]);

  const clearHistory = () => { setMessages([]); localStorage.removeItem("bookmoth_ai_messages"); };

  return (
    <AIContext.Provider
      value={{
        messages, isPanelOpen, currentProvider, isBusy, installed,
        sendMessage, sendInput, setPanelOpen, setProvider, clearHistory,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAI() {
  const context = useContext(AIContext);
  if (context === undefined) throw new Error("useAI must be used within an AIProvider");
  return context;
}
