import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Entity, EntityType, Relationship, Asset, PlotThread, MemoryChunk, EntitySchema } from "./types";

const ROOT = process.cwd();
const ENTITIES_DIR = path.join(ROOT, "entities");
const GRAPH_FILE = path.join(ROOT, "entities", "_graph.json");
const ASSETS_FILE = path.join(ROOT, "entities", "_assets.json");
const THREADS_FILE = path.join(ROOT, "entities", "_plot_threads.json");
const MEMORY_FILE = path.join(ROOT, "entities", "_memory.json");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as T;
  } catch {
    return fallback;
  }
}

function writeJson(file: string, data: unknown) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── Entities ──────────────────────────────────────────────────────────────

export function entityPath(type: EntityType, slug: string): string {
  return path.join(ENTITIES_DIR, type, `${slug}.json`);
}

export function getEntity(type: EntityType, slug: string): Entity | null {
  const file = entityPath(type, slug);
  if (!fs.existsSync(file)) return null;
  try { return EntitySchema.parse(readJson(file, {})); } catch { return null; }
}

export function getEntityById(id: string): Entity | null {
  return getAllEntities().find((e) => e.id === id) ?? null;
}

export function getAllEntities(type?: EntityType): Entity[] {
  ensureDir(ENTITIES_DIR);
  const results: Entity[] = [];
  const types = type ? [type] : fs.readdirSync(ENTITIES_DIR).filter(
    (f) => !f.startsWith("_") && fs.statSync(path.join(ENTITIES_DIR, f)).isDirectory()
  ) as EntityType[];
  for (const t of types) {
    const dir = path.join(ENTITIES_DIR, t);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      try {
        results.push(EntitySchema.parse(readJson(path.join(dir, file), {})));
      } catch { /* skip malformed */ }
    }
  }
  return results.sort((a, b) => b.importance - a.importance || a.name.localeCompare(b.name));
}

export function saveEntity(entity: Omit<Entity, "id" | "created_at" | "updated_at"> & Partial<Pick<Entity, "id" | "created_at">>): Entity {
  ensureDir(ENTITIES_DIR);
  ensureDir(path.join(ENTITIES_DIR, entity.type));
  const now = new Date().toISOString();
  const { id: _id, created_at: _ca, updated_at: _ua, ...rest } = entity as Entity;
  const full: Entity = {
    ...rest,
    id: _id || uuidv4(),
    created_at: _ca || now,
    updated_at: now,
    version: rest.version ?? 1,
  } as Entity;
  writeJson(entityPath(full.type, full.slug), full);
  return full;
}

export function deleteEntity(type: EntityType, slug: string): void {
  const file = entityPath(type, slug);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  // Clean up relationships
  const graph = getGraph();
  graph.relationships = graph.relationships.filter(
    (r) => r.source_id !== slug && r.target_id !== slug
  );
  writeJson(GRAPH_FILE, graph);
}

// ─── Relationships / Graph ──────────────────────────────────────────────────

interface Graph {
  relationships: Relationship[];
}

function getGraph(): Graph {
  return readJson<Graph>(GRAPH_FILE, { relationships: [] });
}

export function getRelationships(entityId?: string): Relationship[] {
  const graph = getGraph();
  if (!entityId) return graph.relationships;
  return graph.relationships.filter(
    (r) => r.source_id === entityId || (r.bidirectional && r.target_id === entityId) || r.target_id === entityId
  );
}

export function addRelationship(rel: Omit<Relationship, "id" | "created_at">): Relationship {
  const graph = getGraph();
  const full: Relationship = { ...rel, id: uuidv4(), created_at: new Date().toISOString() };
  graph.relationships.push(full);
  writeJson(GRAPH_FILE, graph);
  return full;
}

export function deleteRelationship(id: string): void {
  const graph = getGraph();
  graph.relationships = graph.relationships.filter((r) => r.id !== id);
  writeJson(GRAPH_FILE, graph);
}

// Graph traversal: find all entities N hops from a starting entity
export function traverseGraph(entityId: string, maxHops = 2): Set<string> {
  const visited = new Set<string>([entityId]);
  const queue: Array<{ id: string; hops: number }> = [{ id: entityId, hops: 0 }];
  const rels = getGraph().relationships;
  while (queue.length) {
    const { id, hops } = queue.shift()!;
    if (hops >= maxHops) continue;
    for (const r of rels) {
      const neighbor = r.source_id === id ? r.target_id : (r.bidirectional && r.target_id === id ? r.source_id : null);
      if (neighbor && !visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ id: neighbor, hops: hops + 1 });
      }
    }
  }
  return visited;
}

// ─── Assets ─────────────────────────────────────────────────────────────────

interface AssetStore {
  assets: Asset[];
}

export function getAssets(entityId?: string): Asset[] {
  const store = readJson<AssetStore>(ASSETS_FILE, { assets: [] });
  if (!entityId) return store.assets;
  return store.assets.filter((a) => a.entity_id === entityId);
}

export function saveAsset(asset: Omit<Asset, "id" | "created_at">): Asset {
  const store = readJson<AssetStore>(ASSETS_FILE, { assets: [] });
  const full: Asset = { ...asset, id: uuidv4(), created_at: new Date().toISOString() };
  store.assets.push(full);
  writeJson(ASSETS_FILE, store);
  return full;
}

export function deleteAsset(id: string): void {
  const store = readJson<AssetStore>(ASSETS_FILE, { assets: [] });
  const asset = store.assets.find((a) => a.id === id);
  if (asset) {
    const fullPath = path.join(ROOT, "assets", asset.storage_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  store.assets = store.assets.filter((a) => a.id !== id);
  writeJson(ASSETS_FILE, store);
}

// ─── Plot Threads ────────────────────────────────────────────────────────────

interface ThreadStore { threads: PlotThread[] }

export function getThreads(): PlotThread[] {
  return readJson<ThreadStore>(THREADS_FILE, { threads: [] }).threads;
}

export function saveThread(thread: Omit<PlotThread, "id" | "created_at" | "updated_at"> & Partial<Pick<PlotThread, "id">>): PlotThread {
  const store = readJson<ThreadStore>(THREADS_FILE, { threads: [] });
  const now = new Date().toISOString();
  const full: PlotThread = { ...thread as PlotThread, id: thread.id || uuidv4(), created_at: now, updated_at: now };
  const idx = store.threads.findIndex((t) => t.id === full.id);
  if (idx >= 0) { store.threads[idx] = { ...full, updated_at: now }; }
  else store.threads.push(full);
  writeJson(THREADS_FILE, store);
  return full;
}

export function deleteThread(id: string): void {
  const store = readJson<ThreadStore>(THREADS_FILE, { threads: [] });
  store.threads = store.threads.filter((t) => t.id !== id);
  writeJson(THREADS_FILE, store);
}

// ─── Memory / Compressed summaries ──────────────────────────────────────────

interface MemoryStore { chunks: MemoryChunk[] }

export function getMemoryChunks(opts?: { characters?: string[]; tier?: string }): MemoryChunk[] {
  const store = readJson<MemoryStore>(MEMORY_FILE, { chunks: [] });
  let chunks = store.chunks;
  if (opts?.tier) chunks = chunks.filter((c) => c.tier === opts.tier);
  if (opts?.characters?.length) {
    chunks = chunks.filter((c) =>
      c.characters.some((ch) => opts.characters!.includes(ch))
    );
  }
  return chunks;
}

export function saveMemoryChunk(chunk: Omit<MemoryChunk, "id" | "created_at"> & Partial<Pick<MemoryChunk, "id">>): MemoryChunk {
  const store = readJson<MemoryStore>(MEMORY_FILE, { chunks: [] });
  const full: MemoryChunk = { ...chunk as MemoryChunk, id: chunk.id || uuidv4(), created_at: new Date().toISOString() };
  const idx = store.chunks.findIndex((c) => c.id === full.id);
  if (idx >= 0) store.chunks[idx] = full;
  else store.chunks.push(full);
  writeJson(MEMORY_FILE, store);
  return full;
}

// Local cosine similarity for retrieval (no external vector DB needed for small projects)
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) + 1e-8);
}
