import { ipcMain, app } from "electron";
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

// ─── Project root (same dir as the app) ─────────────────────────────────────
function ROOT(): string {
  return app.isPackaged ? path.dirname(app.getPath("exe")) : process.cwd();
}

const dirs = () => ({
  story: path.join(ROOT(), "story"),
  kb: path.join(ROOT(), "kb"),
  work: path.join(ROOT(), "work"),
  entities: path.join(ROOT(), "entities"),
  assets: path.join(ROOT(), "assets"),
  config: path.join(ROOT(), ".bookmoth"),
  PROJECT: path.join(ROOT(), "project.json"),
  GRAPH: path.join(ROOT(), "entities", "_graph.json"),
  ASSETS_IDX: path.join(ROOT(), "entities", "_assets.json"),
});

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson<T>(file: string, fallback: T): T {
  try { return JSON.parse(fs.readFileSync(file, "utf-8")) as T; }
  catch { return fallback; }
}

function writeJson(file: string, data: unknown) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ─── Frontmatter ─────────────────────────────────────────────────────────────
function parseFrontmatter(content: string) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {} as Record<string, string>, body: content };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const [k, ...v] = line.split(":");
    if (k && v.length) meta[k.trim()] = v.join(":").trim();
  }
  return { meta, body: match[2] };
}

function buildFrontmatter(meta: Record<string, string>, body: string) {
  return `---\n${Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join("\n")}\n---\n${body}`;
}

// ─── PROJECT ─────────────────────────────────────────────────────────────────
ipcMain.handle("project:get", () => {
  const { PROJECT } = dirs();
  if (!fs.existsSync(PROJECT)) {
    return { title: "My Novel", genre: "", synopsis: "", createdAt: new Date().toISOString() };
  }
  return readJson(PROJECT, { title: "My Novel", genre: "", synopsis: "", createdAt: new Date().toISOString() });
});

ipcMain.handle("project:set", (_e, data: object) => {
  const { PROJECT } = dirs();
  writeJson(PROJECT, data);
  return data;
});

// ─── CHAPTERS ────────────────────────────────────────────────────────────────
ipcMain.handle("chapters:list", () => {
  const { story, work } = dirs();
  ensureDir(story);
  return fs.readdirSync(story)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .map((f) => {
      const slug = f.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(story, f), "utf-8");
      const { meta, body } = parseFrontmatter(raw);
      return {
        slug,
        title: meta.title || slug,
        brief: meta.brief || "",
        order: parseInt(meta.order || "0"),
        wordCount: body.trim() ? body.trim().split(/\s+/).length : 0,
        updatedAt: meta.updatedAt || new Date().toISOString(),
        hasVoiceDraft: fs.existsSync(path.join(work, "drafts", `${slug}.md`)),
      };
    })
    .sort((a, b) => a.order - b.order);
});

ipcMain.handle("chapters:get", (_e, slug: string) => {
  const { story } = dirs();
  const file = path.join(story, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  const { meta, body } = parseFrontmatter(raw);
  return { slug, title: meta.title || slug, brief: meta.brief || "", order: parseInt(meta.order || "0"), content: body, updatedAt: meta.updatedAt || new Date().toISOString() };
});

ipcMain.handle("chapters:create", (_e, data: { title: string; brief?: string }) => {
  const { story } = dirs();
  ensureDir(story);
  const existing = fs.readdirSync(story).filter((f) => f.endsWith(".md"));
  const order = existing.length;
  const slug = `${String(order + 1).padStart(2, "0")}-${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const now = new Date().toISOString();
  fs.writeFileSync(
    path.join(story, `${slug}.md`),
    buildFrontmatter({ title: data.title, brief: data.brief || "", order: String(order), updatedAt: now }, "")
  );
  return { slug };
});

ipcMain.handle("chapters:save", (_e, slug: string, content: string, meta?: Record<string, string>) => {
  const { story } = dirs();
  const file = path.join(story, `${slug}.md`);
  const existing = fs.existsSync(file) ? parseFrontmatter(fs.readFileSync(file, "utf-8")).meta : {};
  const updatedMeta = { ...existing, ...(meta || {}), updatedAt: new Date().toISOString() };
  fs.writeFileSync(file, buildFrontmatter(updatedMeta, content));
  return { ok: true };
});

ipcMain.handle("chapters:delete", (_e, slug: string) => {
  const { story } = dirs();
  const file = path.join(story, `${slug}.md`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return { ok: true };
});

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────
function walkKb(dir: string, base: string): { path: string; name: string; category: string; updatedAt: string }[] {
  const results: { path: string; name: string; category: string; updatedAt: string }[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).replace(/\\/g, "/");
    if (entry.isDirectory()) {
      results.push(...walkKb(full, base));
    } else if (entry.name.endsWith(".md")) {
      const parts = rel.split("/");
      const cat = parts[0] as string;
      const validCats = ["characters", "world", "style", "continuity"];
      results.push({
        path: rel,
        name: entry.name.replace(/\.md$/, ""),
        category: validCats.includes(cat) ? cat : "other",
        updatedAt: fs.statSync(full).mtime.toISOString(),
      });
    }
  }
  return results;
}

ipcMain.handle("kb:list", () => walkKb(dirs().kb, dirs().kb));

ipcMain.handle("kb:get", (_e, kbPath: string) => {
  const file = path.join(dirs().kb, kbPath);
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf-8");
});

ipcMain.handle("kb:save", (_e, kbPath: string, content: string) => {
  const file = path.join(dirs().kb, kbPath);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
  return { ok: true };
});

ipcMain.handle("kb:delete", (_e, kbPath: string) => {
  const file = path.join(dirs().kb, kbPath);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return { ok: true };
});

ipcMain.handle("kb:create", (_e, kbPath: string, name: string) => {
  const file = path.join(dirs().kb, kbPath, `${name.toLowerCase().replace(/\s+/g, "-")}.md`);
  ensureDir(path.dirname(file));
  if (!fs.existsSync(file)) fs.writeFileSync(file, `# ${name}\n\n`);
  return path.relative(dirs().kb, file).replace(/\\/g, "/");
});

// ─── ENTITIES ────────────────────────────────────────────────────────────────
function readEntities(type?: string) {
  const { entities } = dirs();
  ensureDir(entities);
  const results: object[] = [];
  const types = type
    ? [type]
    : fs.existsSync(entities)
      ? fs.readdirSync(entities).filter((f) => !f.startsWith("_") && fs.statSync(path.join(entities, f)).isDirectory())
      : [];
  for (const t of types) {
    const dir = path.join(entities, t);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
      try { results.push(readJson(path.join(dir, f), {})); } catch { /* skip */ }
    }
  }
  return results;
}

ipcMain.handle("entities:list", (_e, type?: string) => readEntities(type));

ipcMain.handle("entities:get", (_e, id: string) => {
  return (readEntities() as Array<{ id: string }>).find((e) => e.id === id) ?? null;
});

ipcMain.handle("entities:save", (_e, entity: { id?: string; type: string; slug: string; name: string; [k: string]: unknown }) => {
  const { entities } = dirs();
  const now = new Date().toISOString();
  const full = {
    ...entity,
    id: entity.id || uuidv4(),
    created_at: (entity.created_at as string) || now,
    updated_at: now,
    version: ((entity.version as number) ?? 0) + 1,
  };
  ensureDir(path.join(entities, entity.type));
  writeJson(path.join(entities, entity.type, `${entity.slug}.json`), full);
  return full;
});

ipcMain.handle("entities:delete", (_e, id: string) => {
  const entity = (readEntities() as Array<{ id: string; type: string; slug: string }>).find((e) => e.id === id);
  if (!entity) return { ok: false };
  const file = path.join(dirs().entities, entity.type, `${entity.slug}.json`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return { ok: true };
});

// ─── RELATIONSHIPS ───────────────────────────────────────────────────────────
function getGraph() {
  return readJson<{ relationships: object[] }>(dirs().GRAPH, { relationships: [] });
}

ipcMain.handle("relationships:list", (_e, entityId?: string) => {
  const rels = getGraph().relationships as Array<{ source_id: string; target_id: string; bidirectional?: boolean }>;
  if (!entityId) return rels;
  return rels.filter((r) => r.source_id === entityId || r.target_id === entityId);
});

ipcMain.handle("relationships:create", (_e, rel: object) => {
  const graph = getGraph();
  const full = { ...rel, id: uuidv4(), created_at: new Date().toISOString() };
  graph.relationships.push(full);
  writeJson(dirs().GRAPH, graph);
  return full;
});

ipcMain.handle("relationships:delete", (_e, id: string) => {
  const graph = getGraph();
  graph.relationships = (graph.relationships as Array<{ id: string }>).filter((r) => r.id !== id);
  writeJson(dirs().GRAPH, graph);
  return { ok: true };
});

// ─── ASSETS ─────────────────────────────────────────────────────────────────
ipcMain.handle("assets:list", (_e, entityId?: string) => {
  const store = readJson<{ assets: Array<{ entity_id?: string }> }>(dirs().ASSETS_IDX, { assets: [] });
  return entityId ? store.assets.filter((a) => a.entity_id === entityId) : store.assets;
});

ipcMain.handle("assets:save", (_e, assetMeta: object, fileBuffer: ArrayBuffer, filename: string, subdir: string) => {
  const { assets, ASSETS_IDX } = dirs();
  const timestamp = Date.now();
  const safeName = filename.replace(/[^a-z0-9._-]/gi, "_");
  const storagePath = `${subdir}/${timestamp}-${safeName}`;
  const fullPath = path.join(assets, storagePath);
  ensureDir(path.dirname(fullPath));
  fs.writeFileSync(fullPath, Buffer.from(fileBuffer));
  const store = readJson<{ assets: object[] }>(ASSETS_IDX, { assets: [] });
  const full = { ...assetMeta, id: uuidv4(), storage_path: storagePath, created_at: new Date().toISOString() };
  store.assets.push(full);
  writeJson(ASSETS_IDX, store);
  return full;
});

ipcMain.handle("assets:delete", (_e, id: string) => {
  const { assets, ASSETS_IDX } = dirs();
  const store = readJson<{ assets: Array<{ id: string; storage_path: string }> }>(ASSETS_IDX, { assets: [] });
  const asset = store.assets.find((a) => a.id === id);
  if (asset) {
    const fullPath = path.join(assets, asset.storage_path);
    if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
  }
  store.assets = store.assets.filter((a) => a.id !== id);
  writeJson(ASSETS_IDX, store);
  return { ok: true };
});

// ─── PROVIDERS ───────────────────────────────────────────────────────────────
const BUILT_IN_PROVIDERS = [
  { id: "claude-code", name: "Claude Code (Pro)", command: "claude", args: ["--print", "--output-format", "text"], type: "claude-code", capabilities: ["write", "summarize", "analyze", "critique", "extract"], maxContextTokens: 200000, costTier: "pro", streamOutput: false, promptFormat: "raw", enabled: true },
  { id: "ollama-llama3", name: "Ollama (llama3)", command: "ollama", args: ["run", "llama3"], type: "ollama", capabilities: ["write", "summarize", "analyze"], maxContextTokens: 8192, costTier: "free", streamOutput: true, promptFormat: "raw", enabled: false },
  { id: "gemini-cli", name: "Gemini CLI", command: "gemini", args: [], type: "gemini-cli", capabilities: ["write", "summarize", "analyze", "critique"], maxContextTokens: 128000, costTier: "free", streamOutput: false, promptFormat: "raw", enabled: false },
];

function getProviderConfig() {
  const file = path.join(dirs().config, "providers.json");
  try { if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf-8")); } catch { /* use defaults */ }
  return { providers: BUILT_IN_PROVIDERS, defaultProviders: { write: "claude-code", summarize: "claude-code", analyze: "claude-code", critique: "claude-code", extract: "claude-code" } };
}

ipcMain.handle("providers:get", () => getProviderConfig());

ipcMain.handle("providers:set", (_e, config: object) => {
  const file = path.join(dirs().config, "providers.json");
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(config, null, 2));
  return { ok: true };
});

ipcMain.handle("providers:check", (_e, providerId: string) => {
  const { execFileSync } = require("child_process") as typeof import("child_process");
  const cfg = getProviderConfig() as { providers: Array<{ id: string; command: string }> };
  const provider = cfg.providers.find((p) => p.id === providerId);
  if (!provider) return { available: false };
  try {
    execFileSync(provider.command, ["--version"], { timeout: 5000, stdio: "pipe" });
    return { available: true };
  } catch {
    return { available: false };
  }
});
