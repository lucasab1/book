import fs from "fs";
import path from "path";
import { CLIProvider, ProviderConfig } from "./types";

const CONFIG_FILE = path.join(process.cwd(), ".bookmoth", "providers.json");

export const BUILT_IN_PROVIDERS: CLIProvider[] = [
  {
    id: "claude-code",
    name: "Claude Code (Pro)",
    command: "claude",
    args: ["--print"],
    type: "claude-code",
    capabilities: ["write", "summarize", "analyze", "critique", "extract"],
    maxContextTokens: 200000,
    costTier: "pro",
    streamOutput: false,
    promptFormat: "raw",
    enabled: true,
  },
  {
    id: "ollama-llama3",
    name: "Ollama (llama3)",
    command: "ollama",
    args: ["run", "llama3"],
    type: "ollama",
    capabilities: ["write", "summarize", "analyze"],
    maxContextTokens: 8192,
    costTier: "free",
    streamOutput: true,
    promptFormat: "raw",
    enabled: false,
  },
  {
    id: "ollama-mistral",
    name: "Ollama (mistral)",
    command: "ollama",
    args: ["run", "mistral"],
    type: "ollama",
    capabilities: ["summarize", "extract"],
    maxContextTokens: 8192,
    costTier: "free",
    streamOutput: true,
    promptFormat: "raw",
    enabled: false,
  },
  {
    id: "gemini-cli",
    name: "Gemini CLI",
    command: "gemini",
    args: ["--prompt", ""],
    type: "gemini-cli",
    capabilities: ["write", "summarize", "analyze", "critique"],
    maxContextTokens: 128000,
    costTier: "free",
    streamOutput: false,
    promptFormat: "raw",
    enabled: false,
  },
];

export function getProviderConfig(): ProviderConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8")) as ProviderConfig;
    }
  } catch { /* use defaults */ }
  return {
    providers: BUILT_IN_PROVIDERS,
    defaultProviders: {
      write: "claude-code",
      summarize: "claude-code",
      analyze: "claude-code",
      critique: "claude-code",
      extract: "claude-code",
    },
  };
}

export function saveProviderConfig(config: ProviderConfig): void {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

export function getProvider(id: string): CLIProvider | null {
  return getProviderConfig().providers.find((p) => p.id === id) ?? null;
}

export function getDefaultProvider(task: string): CLIProvider | null {
  const config = getProviderConfig();
  const id = (config.defaultProviders as Record<string, string>)[task];
  return config.providers.find((p) => p.id === id && p.enabled) ?? null;
}
