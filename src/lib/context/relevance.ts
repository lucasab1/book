import { Entity, MemoryChunk } from "../entities/types";

export interface SceneContext {
  characters: string[];      // entity slugs/IDs in scene
  location?: string;
  topics?: string[];
  chapterOrder?: number;
  emotionalBeat?: string;
  plotThreadIds?: string[];
}

export interface ScoredEntity {
  entity: Entity;
  score: number;
  reason: string;
}

// Score an entity's relevance to a scene context
export function scoreEntityRelevance(entity: Entity, ctx: SceneContext): number {
  let score = 0;

  // Direct mention in scene
  const nameLower = entity.name.toLowerCase();
  const slugLower = entity.slug.toLowerCase();
  if (ctx.characters.some((c) => c.toLowerCase() === nameLower || c.toLowerCase() === slugLower)) {
    score += 1.0; // Direct participant
  }

  // Location match
  if (ctx.location && entity.type === "location") {
    if (entity.slug.toLowerCase() === ctx.location.toLowerCase() ||
        entity.name.toLowerCase() === ctx.location.toLowerCase()) {
      score += 0.8;
    }
  }

  // Topic overlap
  if (ctx.topics?.length) {
    const entityTopics = [...entity.tags, entity.type, entity.name.toLowerCase()];
    const overlap = ctx.topics.filter((t) =>
      entityTopics.some((et) => et.toLowerCase().includes(t.toLowerCase()))
    );
    score += overlap.length * 0.3;
  }

  // Importance baseline
  score += entity.importance * 0.05;

  return Math.min(score, 1.0);
}

// Score a memory chunk's relevance to a scene context
export function scoreChunkRelevance(chunk: MemoryChunk, ctx: SceneContext): number {
  let score = 0;

  // Character overlap
  const charOverlap = ctx.characters.filter((c) =>
    chunk.characters.some((cc) => cc.toLowerCase() === c.toLowerCase())
  );
  score += charOverlap.length * 0.4;

  // Location match
  if (ctx.location && chunk.locations.some((l) => l.toLowerCase() === ctx.location!.toLowerCase())) {
    score += 0.3;
  }

  // Topic overlap
  if (ctx.topics?.length) {
    const overlap = ctx.topics.filter((t) =>
      chunk.topics.some((ct) => ct.toLowerCase().includes(t.toLowerCase()))
    );
    score += overlap.length * 0.2;
  }

  // Recency bonus — more recent chapters score higher
  // Requires knowing total chapter count; approximated via ID sorting
  const chapterNum = parseInt(chunk.source_id.split("-")[0] || "0");
  if (!isNaN(chapterNum)) score += Math.min(chapterNum * 0.01, 0.2);

  // Tier preference: compact > ultra for RAG (full is for recent window)
  if (chunk.tier === "compact") score += 0.1;
  if (chunk.tier === "ultra") score += 0.05;

  // Hook boost
  if (chunk.hooks.length > 0) score += 0.1;

  // Importance
  score += chunk.importance * 0.02;

  return Math.min(score, 1.0);
}

// Select top-K entities given a scene context, within token budget
export function selectRelevantEntities(
  entities: Entity[],
  ctx: SceneContext,
  opts: { maxEntities: number; minScore?: number }
): ScoredEntity[] {
  const minScore = opts.minScore ?? 0.1;

  return entities
    .map((e) => ({ entity: e, score: scoreEntityRelevance(e, ctx), reason: "" }))
    .filter((s) => s.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.maxEntities)
    .map((s) => ({
      ...s,
      reason: s.score >= 0.9 ? "direct participant"
             : s.score >= 0.6 ? "location/setting"
             : s.score >= 0.3 ? "topic overlap"
             : "importance",
    }));
}

// Select top-K memory chunks for RAG injection
export function selectRelevantChunks(
  chunks: MemoryChunk[],
  ctx: SceneContext,
  opts: { maxChunks: number; excludeRecent?: number }
): MemoryChunk[] {
  let candidates = chunks;
  if (opts.excludeRecent) {
    // Skip the most recent N chunks (they'll be in the "recent window" instead)
    candidates = candidates.slice(0, -opts.excludeRecent);
  }
  return candidates
    .map((c) => ({ chunk: c, score: scoreChunkRelevance(c, ctx) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, opts.maxChunks)
    .map((s) => s.chunk);
}
