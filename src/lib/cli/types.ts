export interface CLIProvider {
  id: string;
  name: string;
  command: string;               // "claude", "ollama", "gemini", etc.
  args: string[];                // e.g. ["run", "llama3"]
  type: "claude-code" | "ollama" | "gemini-cli" | "openrouter-cli" | "lm-studio" | "kobold" | "generic";
  capabilities: ("write" | "summarize" | "embed" | "analyze" | "critique" | "extract")[];
  maxContextTokens: number;
  costTier: "free" | "pro" | "paid";
  streamOutput: boolean;
  promptFormat: "raw" | "chat" | "instruct";
  enabled: boolean;
  // Per-task model routing
  taskModels?: {
    write?: string;              // e.g. "ollama run mistral"
    summarize?: string;
    analyze?: string;
  };
}

export type TaskType = "write" | "summarize" | "analyze" | "critique" | "extract" | "embed";

export interface GenerationTask {
  id: string;
  type: TaskType;
  providerId: string;
  prompt: string;
  systemPrompt?: string;
  contextTokenBudget?: number;
  maxOutputTokens?: number;
  temperature?: number;
  structuredOutput?: boolean;    // expect JSON back
  metadata?: Record<string, unknown>;
}

export interface GenerationResult {
  taskId: string;
  providerId: string;
  content: string;
  usage?: { inputTokens?: number; outputTokens?: number };
  durationMs: number;
  error?: string;
}

export interface StreamChunk {
  taskId: string;
  delta: string;
  done: boolean;
  error?: string;
}

// Provider config persisted to disk
export interface ProviderConfig {
  providers: CLIProvider[];
  defaultProviders: {
    write: string;
    summarize: string;
    analyze: string;
    critique: string;
    extract: string;
  };
}
