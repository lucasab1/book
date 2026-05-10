// Client-side API — thin wrappers over window.api (Electron IPC)
// Never import Node.js modules here; this runs in the renderer process.

declare global {
  interface Window {
    api: {
      platform: string;

      // Project management
      projectGetPath: () => Promise<string | null>;
      projectGetRecents: () => Promise<string[]>;
      projectPickFolder: () => Promise<string | null>;
      projectCreate: (folderPath: string, meta: { title: string; genre: string; synopsis: string }) => Promise<{ ok: boolean }>;
      projectOpen: (folderPath: string) => Promise<{ ok: boolean; error?: string }>;
      projectOpenFolder: () => Promise<void>;
      projectOpenTerminal: () => Promise<void>;
      projectGet: () => Promise<ProjectMeta | null>;
      projectSet: (data: object) => Promise<ProjectMeta>;

      chaptersList: () => Promise<ChapterFile[]>;
      chaptersGet: (slug: string) => Promise<ChapterDetail | null>;
      chaptersCreate: (data: { title: string; brief?: string }) => Promise<{ slug: string }>;
      chaptersSave: (slug: string, content: string, meta?: Record<string, string>) => Promise<{ ok: boolean }>;
      chaptersDelete: (slug: string) => Promise<{ ok: boolean }>;

      kbList: () => Promise<KbEntry[]>;
      kbGet: (kbPath: string) => Promise<string | null>;
      kbSave: (kbPath: string, content: string) => Promise<{ ok: boolean }>;
      kbDelete: (kbPath: string) => Promise<{ ok: boolean }>;
      kbCreate: (kbPath: string, name: string) => Promise<string>;

      entitiesList: (type?: string) => Promise<Entity[]>;
      entitiesGet: (id: string) => Promise<Entity | null>;
      entitiesSave: (entity: object) => Promise<Entity>;
      entitiesDelete: (id: string) => Promise<{ ok: boolean }>;

      relationshipsList: (entityId?: string) => Promise<Relationship[]>;
      relationshipsCreate: (rel: object) => Promise<Relationship>;
      relationshipsDelete: (id: string) => Promise<{ ok: boolean }>;

      assetsList: (entityId?: string) => Promise<Asset[]>;
      assetsSave: (meta: object, buffer: ArrayBuffer, filename: string, subdir: string) => Promise<Asset>;
      assetsDelete: (id: string) => Promise<{ ok: boolean }>;

      providersGet: () => Promise<ProviderConfig>;
      providersSet: (config: object) => Promise<{ ok: boolean }>;
      providersCheck: (providerId: string) => Promise<{ available: boolean }>;

      // Import
      importPickFiles: (filters: { name: string; extensions: string[] }[]) => Promise<string[]>;
      importChapters: (filePaths: string[]) => Promise<string[]>;
      importAssets: (filePaths: string[]) => Promise<Asset[]>;

      // Claude Code (legacy)
      claudeRun: (message: string) => Promise<{ output?: string; error?: string }>;
      claudeCheckInstalled: () => Promise<boolean>;
      claudeOnChunk: (cb: (text: string) => void) => () => void;

      // Multi-provider AI
      aiRun: (provider: string, message: string) => Promise<{ output?: string; error?: string }>;
      aiCheckInstalled: () => Promise<{ claude: boolean; gemini: boolean }>;
      aiOnChunk: (cb: (text: string) => void) => () => void;
      aiOnStart: (cb: (data: { pid: number }) => void) => () => void;
      aiSendInput: (pid: number, text: string) => void;
    };
  }
}

export interface ProjectMeta {
  title: string;
  genre: string;
  synopsis: string;
  createdAt: string;
  globalNotes?: string;
}

export interface ChapterFile {
  slug: string;
  title: string;
  brief: string;
  order: number;
  wordCount: number;
  updatedAt: string;
  hasVoiceDraft: boolean;
}

export interface ChapterDetail extends ChapterFile {
  content: string;
}

export interface KbEntry {
  path: string;
  name: string;
  category: "characters" | "world" | "style" | "continuity" | "other";
  updatedAt: string;
}

export const ENTITY_TYPES = [
  "character", "location", "faction", "race", "nation", "religion",
  "magic_system", "skill", "item", "creature", "event", "arc",
  "scene", "timeline", "relationship", "lore",
] as const;
export type EntityType = (typeof ENTITY_TYPES)[number];

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  slug: string;
  description: string;
  rich_content: string;
  metadata: Record<string, unknown>;
  tags: string[];
  importance: number;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface Relationship {
  id: string;
  source_id: string;
  source_name: string;
  target_id: string;
  target_name: string;
  type: string;
  label?: string;
  weight: number;
  bidirectional: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface Asset {
  id: string;
  entity_id?: string;
  type: string;
  filename: string;
  storage_path: string;
  mime_type: string;
  size: number;
  alt?: string;
  tags: string[];
  created_at: string;
}

export interface CLIProvider {
  id: string;
  name: string;
  command: string;
  args: string[];
  type: string;
  capabilities: string[];
  maxContextTokens: number;
  costTier: "free" | "pro" | "paid";
  streamOutput: boolean;
  promptFormat: string;
  enabled: boolean;
}

export interface ProviderConfig {
  providers: CLIProvider[];
  defaultProviders: Record<string, string>;
}

// Re-export window.api directly for use in components
export const api = (() => {
  if (typeof window !== "undefined" && window.api) return window.api;
  // Fallback stub so Vite HMR doesn't crash outside Electron
  const noop = () => Promise.resolve(null as never);
  return new Proxy({} as Window["api"], { get: () => noop });
})();
