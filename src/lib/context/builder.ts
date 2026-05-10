import fs from "fs";
import path from "path";
import { Entity, MemoryChunk } from "../entities/types";
import { SceneContext, selectRelevantEntities, selectRelevantChunks } from "./relevance";
import { getAllEntities, getMemoryChunks, getThreads } from "../entities/store";

// Token budget per slot (approximate — 1 token ≈ 4 chars)
const BUDGETS = {
  system: 800,
  voice: 600,
  scene_objective: 200,
  characters: 300,
  world_state: 300,
  plot_threads: 300,
  relationships: 200,
  rag_memories: 800,
  recent_scenes: 1200,
  request: 300,
} as const;

const CHARS_PER_TOKEN = 4;

function toTokens(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

function truncate(text: string, maxTokens: number): string {
  const maxChars = maxTokens * CHARS_PER_TOKEN;
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - 20) + "\n[... truncated]";
}

function readKbFile(relPath: string): string {
  const full = path.join(process.cwd(), "kb", relPath);
  if (!fs.existsSync(full)) return "";
  return fs.readFileSync(full, "utf-8");
}

function readStoryFile(slug: string): string {
  const full = path.join(process.cwd(), "story", `${slug}.md`);
  if (!fs.existsSync(full)) return "";
  // Strip frontmatter
  const content = fs.readFileSync(full, "utf-8");
  const match = content.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
  return match ? match[1].trim() : content.trim();
}

// Format an entity as a compact JSON-style context block
function formatEntityCompact(entity: Entity): string {
  const meta = entity.metadata as Record<string, unknown>;
  const lines: string[] = [`[${entity.type.toUpperCase()}] ${entity.name}`];
  if (entity.description) lines.push(`  desc: ${entity.description.slice(0, 200)}`);
  // Include key structured state fields
  if (entity.type === "character") {
    const m = meta as { emotional_state?: { dominant?: string }; status?: string; arc_position?: number; goals?: { goal: string }[] };
    if (m.emotional_state?.dominant) lines.push(`  state: ${m.emotional_state.dominant}`);
    if (m.status) lines.push(`  status: ${m.status}`);
    if (m.goals?.length) lines.push(`  goals: ${m.goals.slice(0, 2).map((g) => g.goal).join("; ")}`);
  }
  if (entity.type === "location") {
    const m = meta as { atmosphere?: string; rules?: string[] };
    if (m.atmosphere) lines.push(`  atmosphere: ${m.atmosphere}`);
    if (m.rules?.length) lines.push(`  rules: ${m.rules.slice(0, 2).join("; ")}`);
  }
  return lines.join("\n");
}

// Format a memory chunk for injection
function formatChunk(chunk: MemoryChunk): string {
  const header = `[${chunk.source_id.toUpperCase()} | ${chunk.tier}]`;
  const chars = chunk.characters.length ? ` chars: ${chunk.characters.join(", ")}` : "";
  const beat = chunk.emotional_beat ? ` | beat: ${chunk.emotional_beat}` : "";
  return `${header}${chars}${beat}\n${chunk.content}`;
}

export interface BuiltContext {
  systemPrompt: string;
  userPrompt: string;
  totalTokens: number;
  slots: Record<string, number>;
}

export interface BuildContextOptions {
  sceneContext: SceneContext;
  sceneObjective: string;
  request: string;
  recentChapterSlugs?: string[];   // last 2-3 chapter slugs for verbatim injection
  includeVoiceProfile?: boolean;
  taskType?: string;
}

export function buildContext(opts: BuildContextOptions): BuiltContext {
  const {
    sceneContext,
    sceneObjective,
    request,
    recentChapterSlugs = [],
    includeVoiceProfile = true,
    taskType = "write",
  } = opts;

  const slotSizes: Record<string, number> = {};
  const parts: string[] = [];

  // ── 1. Voice profile ────────────────────────────────────────────────────
  let voiceSection = "";
  if (includeVoiceProfile && taskType === "write") {
    const profile = readKbFile("style/voice-profile.md");
    if (profile) {
      voiceSection = truncate(profile, BUDGETS.voice);
      slotSizes.voice = toTokens(voiceSection);
    }
  }

  // ── 2. Relevant entities ─────────────────────────────────────────────────
  const allEntities = getAllEntities();
  const relevantEntities = selectRelevantEntities(allEntities, sceneContext, {
    maxEntities: 8,
    minScore: 0.1,
  });

  // Deduplicate: don't include characters already covered in recent scenes
  const entitySection = relevantEntities
    .map((s) => formatEntityCompact(s.entity))
    .join("\n\n");
  slotSizes.characters = toTokens(entitySection);

  // ── 3. Active plot threads ───────────────────────────────────────────────
  const threads = getThreads().filter((t) =>
    t.status !== "resolved" && t.status !== "abandoned" &&
    (sceneContext.plotThreadIds?.includes(t.id) ||
     t.involved_entities.some((e) => sceneContext.characters.includes(e)))
  ).slice(0, 5);

  const threadsSection = threads.map((t) =>
    `[THREAD] ${t.title} (${t.status}, tension: ${t.tension_level}/10)\n${t.description}`
  ).join("\n\n");
  slotSizes.plot_threads = toTokens(threadsSection);

  // ── 4. RAG memories ──────────────────────────────────────────────────────
  const allChunks = getMemoryChunks();
  const ragChunks = selectRelevantChunks(allChunks, sceneContext, {
    maxChunks: 4,
    excludeRecent: recentChapterSlugs.length,
  });
  const ragSection = ragChunks.map(formatChunk).join("\n\n---\n\n");
  slotSizes.rag_memories = toTokens(ragSection);

  // ── 5. Recent scenes (verbatim) ──────────────────────────────────────────
  const recentSection = recentChapterSlugs
    .slice(-3)
    .map((slug) => {
      const content = readStoryFile(slug);
      return content ? `[CHAPTER: ${slug}]\n${content.slice(0, 1500)}` : "";
    })
    .filter(Boolean)
    .join("\n\n---\n\n");
  slotSizes.recent_scenes = toTokens(recentSection);

  // ── Assemble system prompt ────────────────────────────────────────────────
  const systemParts: string[] = [];

  if (voiceSection) {
    systemParts.push(`## AUTHOR VOICE PROFILE\n${voiceSection}`);
  }

  if (entitySection) {
    systemParts.push(`## RELEVANT ENTITIES\n${entitySection}`);
  }

  if (threadsSection) {
    systemParts.push(`## ACTIVE PLOT THREADS\n${threadsSection}`);
  }

  if (ragSection) {
    systemParts.push(`## RELEVANT HISTORY (compressed)\n${ragSection}`);
  }

  if (recentSection) {
    systemParts.push(`## RECENT CHAPTERS\n${recentSection}`);
  }

  const systemPrompt = systemParts.join("\n\n---\n\n");

  // ── Assemble user prompt ──────────────────────────────────────────────────
  const userParts: string[] = [];

  userParts.push(`## SCENE OBJECTIVE\n${sceneObjective}`);
  userParts.push(`## REQUEST\n${request}`);

  const userPrompt = userParts.join("\n\n");

  const totalTokens = Object.values(slotSizes).reduce((a, b) => a + b, 0) +
    toTokens(systemPrompt) + toTokens(userPrompt);

  parts.push(systemPrompt, userPrompt);

  return {
    systemPrompt,
    userPrompt,
    totalTokens,
    slots: slotSizes,
  };
}
