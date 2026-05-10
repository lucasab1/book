export interface ProjectMeta {
  title: string;
  genre: string;
  synopsis: string;
  createdAt: string;
}

export interface ChapterFile {
  slug: string;       // filename without .md
  title: string;
  brief: string;
  order: number;
  wordCount: number;
  updatedAt: string;
  hasVoiceDraft: boolean;
}

export interface KbEntry {
  path: string;       // relative to kb/
  name: string;
  category: "characters" | "world" | "style" | "continuity" | "other";
  updatedAt: string;
}
