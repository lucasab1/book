import { ipcMain, app, dialog, shell } from "electron";
import fs from "fs";
import path from "path";
import { execFile, spawn } from "child_process";
import { v4 as uuidv4 } from "uuid";

// ─── Settings (persists last project + recents) ───────────────────────────────
const SETTINGS_FILE = path.join(app.getPath("userData"), "settings.json");

interface AppSettings {
  lastProject: string | null;
  recentProjects: string[];
}

function readSettings(): AppSettings {
  try { return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8")); }
  catch { return { lastProject: null, recentProjects: [] }; }
}

function writeSettings(s: AppSettings) {
  fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(s, null, 2));
}

function addRecent(projectPath: string) {
  const s = readSettings();
  s.lastProject = projectPath;
  s.recentProjects = [projectPath, ...s.recentProjects.filter((p) => p !== projectPath)].slice(0, 8);
  writeSettings(s);
}

// ─── Dynamic project root ─────────────────────────────────────────────────────
let PROJECT_ROOT: string = (() => {
  const s = readSettings();
  if (s.lastProject && fs.existsSync(path.join(s.lastProject, "project.json"))) {
    return s.lastProject;
  }
  return "";
})();

function setRoot(p: string) {
  PROJECT_ROOT = p;
  addRecent(p);
}

const dirs = () => ({
  story: path.join(PROJECT_ROOT, "story"),
  kb: path.join(PROJECT_ROOT, "kb"),
  work: path.join(PROJECT_ROOT, "work"),
  entities: path.join(PROJECT_ROOT, "entities"),
  assets: path.join(PROJECT_ROOT, "assets"),
  config: path.join(PROJECT_ROOT, ".bookmoth"),
  PROJECT: path.join(PROJECT_ROOT, "project.json"),
  GRAPH: path.join(PROJECT_ROOT, "entities", "_graph.json"),
  ASSETS_IDX: path.join(PROJECT_ROOT, "entities", "_assets.json"),
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

// ─── Project management ───────────────────────────────────────────────────────

const PROJECT_DIRS = ["story", "kb/characters", "kb/world", "kb/style", "kb/continuity",
  "work/drafts", "work/brainstorm", "work/critique", "entities", "assets"];

ipcMain.handle("project:getPath", () => PROJECT_ROOT || null);

ipcMain.handle("project:getRecents", () => {
  return readSettings().recentProjects.filter((p) => fs.existsSync(path.join(p, "project.json")));
});

ipcMain.handle("project:pickFolder", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle("project:create", (_e, folderPath: string, meta: { title: string; genre: string; synopsis: string }) => {
  for (const d of PROJECT_DIRS) {
    fs.mkdirSync(path.join(folderPath, d), { recursive: true });
  }
  // Starter KB timeline
  fs.writeFileSync(path.join(folderPath, "kb", "timeline.md"), "# Timeline\n\n");
  // project.json
  writeJson(path.join(folderPath, "project.json"), { ...meta, createdAt: new Date().toISOString() });
  setRoot(folderPath);
  return { ok: true };
});

ipcMain.handle("project:open", (_e, folderPath: string) => {
  if (!fs.existsSync(path.join(folderPath, "project.json"))) {
    return { ok: false, error: "No project.json found. This doesn't look like a Bookmoth project." };
  }
  
  // Isolate AI workspace by initializing git if not present and adding .geminiignore
  if (!fs.existsSync(path.join(folderPath, ".git"))) {
    try { require("child_process").execSync("git init", { cwd: folderPath, stdio: "ignore" }); } catch {}
  }
  if (!fs.existsSync(path.join(folderPath, ".geminiignore"))) {
    fs.writeFileSync(path.join(folderPath, ".geminiignore"), "src/\nelectron/\nnode_modules/\ndist/\ndist-electron/\n.git/\n");
  }

  setRoot(folderPath);
  return { ok: true };
});

ipcMain.handle("project:openFolder", () => {
  if (PROJECT_ROOT) shell.openPath(PROJECT_ROOT);
});

ipcMain.handle("project:openTerminal", () => {
  const cwd = PROJECT_ROOT;
  if (!cwd) return;
  if (process.platform === "win32") {
    // Try Windows Terminal first, fall back to PowerShell
    execFile("wt", ["-d", cwd], (err) => {
      if (err) {
        spawn("powershell.exe", ["-NoExit", "-Command", `cd '${cwd}'`], {
          detached: true, stdio: "ignore",
        }).unref();
      }
    });
  } else if (process.platform === "darwin") {
    execFile("open", ["-a", "Terminal", cwd]);
  } else {
    const terms = ["gnome-terminal", "x-terminal-emulator", "xterm"];
    const t = terms.find((t) => { try { execFile(t, ["--version"]); return true; } catch { return false; } }) || "xterm";
    spawn(t, { cwd, detached: true, stdio: "ignore" }).unref();
  }
});

// ─── Import files ─────────────────────────────────────────────────────────────

ipcMain.handle("import:pickFiles", async (_e, filters: { name: string; extensions: string[] }[]) => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile", "multiSelections"],
    filters,
  });
  return result.canceled ? [] : result.filePaths;
});

ipcMain.handle("import:chapters", (_e, filePaths: string[]) => {
  const { story } = dirs();
  ensureDir(story);
  const existing = fs.readdirSync(story).filter((f) => f.endsWith(".md")).length;
  const imported: string[] = [];

  for (let i = 0; i < filePaths.length; i++) {
    const src = filePaths[i];
    const ext = path.extname(src).toLowerCase();
    const rawName = path.basename(src, ext);
    const title = rawName.replace(/[-_]+/g, " ").replace(/^\d+\s*[-.]?\s*/, "").trim() || rawName;
    const slug = `${String(existing + i + 1).padStart(2, "0")}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    const now = new Date().toISOString();

    let body = "";
    if (ext === ".md" || ext === ".txt") {
      body = fs.readFileSync(src, "utf-8");
      // Strip existing frontmatter if present
      body = body.replace(/^---[\s\S]*?---\n/, "");
    }

    const content = `---\ntitle: ${title}\nbrief: \norder: ${existing + i}\nupdatedAt: ${now}\n---\n${body}`;
    fs.writeFileSync(path.join(story, `${slug}.md`), content);
    imported.push(slug);
  }
  return imported;
});

ipcMain.handle("import:assets", (_e, filePaths: string[]) => {
  const { assets, ASSETS_IDX } = dirs();
  const saved: object[] = [];
  for (const src of filePaths) {
    const filename = path.basename(src);
    const safeName = filename.replace(/[^a-z0-9._-]/gi, "_");
    const storagePath = `reference/${Date.now()}-${safeName}`;
    const dest = path.join(assets, storagePath);
    ensureDir(path.dirname(dest));
    fs.copyFileSync(src, dest);
    const store = readJson<{ assets: object[] }>(ASSETS_IDX, { assets: [] });
    const asset = { id: uuidv4(), type: "reference", filename, storage_path: storagePath, mime_type: "image/*", size: fs.statSync(src).size, tags: [], created_at: new Date().toISOString() };
    store.assets.push(asset);
    writeJson(ASSETS_IDX, store);
    saved.push(asset);
  }
  return saved;
});

// ─── AI runner (Claude + Gemini) ─────────────────────────────────────────────

// On Windows, spawn("cmd", [..., message]) joins args with spaces — no quoting.
// So "Leia o texto" becomes --print Leia o texto and --print only gets "Leia".
// Fix: use cmd.exe explicitly with windowsVerbatimArguments so we control quoting.
function spawnAI(event: Electron.IpcMainInvokeEvent, provider: string, message: string, cwd: string) {
  return new Promise<{ output?: string; error?: string }>((resolve) => {
    let proc: ReturnType<typeof spawn>;

    if (process.platform === "win32") {
      // Use powershell.exe for better command resolution on Windows
      const q = (s: string) => `'${s.replace(/'/g, "''")}'`;
      const systemPrompt = `[SYSTEM: You are the Bookmoth Editorial Assistant. You MUST ONLY consider files in story/, kb/, entities/, assets/, and work/. COMPLETELY IGNORE the app source code (src/, electron/, node_modules/, etc.).]\n\n`;
      const psCmd = provider === "gemini"
        ? `gemini --prompt ${q(systemPrompt + message)}`
        : `claude --print ${q(systemPrompt + message)}`;
      
      console.log(`[IPC] Spawning AI: ${psCmd}`);
      proc = spawn("powershell.exe", ["-NoProfile", "-Command", psCmd], {
        cwd,
        env: { 
          ...process.env, 
          FORCE_COLOR: "1",
          GEMINI_CLI_TRUST_WORKSPACE: "true",
          CLAUDE_CODE_TRUST_WORKSPACE: "true"
        },
        stdio: ["pipe", "pipe", "pipe"],
      });
    } else {
      const [cmd, ...args] = provider === "gemini"
        ? ["gemini", "--prompt", message]
        : ["claude", "--print", message];
      
      console.log(`[IPC] Spawning AI: ${cmd} ${args.join(" ")}`);
      proc = spawn(cmd, args, { 
        cwd, 
        env: { 
          ...process.env, 
          FORCE_COLOR: "1",
          GEMINI_CLI_TRUST_WORKSPACE: "true",
          CLAUDE_CODE_TRUST_WORKSPACE: "true"
        }, 
        stdio: ["pipe", "pipe", "pipe"] 
      });
    }

    const pid = proc.pid || Math.random();
    activeProcesses.set(pid, proc);
    event.sender.send("ai:start", { pid });

    let output = "";
    let errOut = "";

    proc.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      output += text;
      event.sender.send("ai:chunk", text);
    });

    proc.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString();
      errOut += text;
      event.sender.send("ai:chunk", text);
    });

    proc.on("close", (code) => {
      activeProcesses.delete(pid);
      if (code !== 0 && !output) resolve({ error: errOut || `exited with code ${code}` });
      else resolve({ output });
    });

    proc.on("error", (err) => {
      activeProcesses.delete(pid);
      resolve({ error: err.message });
    });
  });
}

// provider: "claude" | "gemini"
const activeProcesses = new Map<number, ReturnType<typeof spawn>>();

ipcMain.handle("ai:run", async (event, provider: string, message: string) => {
  const cwd = PROJECT_ROOT;
  if (!cwd) return { error: "No project open." };
  return spawnAI(event, provider, message, cwd);
});

ipcMain.on("ai:input", (_e, { pid, text }) => {
  const proc = activeProcesses.get(pid);
  if (proc && proc.stdin) {
    proc.stdin.write(text + "\n");
  }
});

ipcMain.handle("ai:checkInstalled", async () => {
  function check(cmd: string) {
    return new Promise<boolean>((resolve) => {
      execFile(cmd, ["--version"], { timeout: 5000, shell: process.platform === "win32" }, (err) => resolve(!err));
    });
  }
  const [claude, gemini] = await Promise.all([check("claude"), check("gemini")]);
  return { claude, gemini };
});

// Keep old claude:run for backwards compat
ipcMain.handle("claude:run", async (event, message: string) => {
  const cwd = PROJECT_ROOT;
  if (!cwd) return { error: "No project open." };
  return spawnAI(event, "claude", message, cwd);
});

ipcMain.handle("claude:checkInstalled", () => {
  return new Promise<boolean>((resolve) => {
    execFile("claude", ["--version"], { timeout: 5000, shell: process.platform === "win32" }, (err) => resolve(!err));
  });
});

// ─── PROJECT (CRUD) ───────────────────────────────────────────────────────────
ipcMain.handle("project:get", () => {
  if (!PROJECT_ROOT) return null;
  const { PROJECT } = dirs();
  if (!fs.existsSync(PROJECT)) return { title: "My Novel", genre: "", synopsis: "", createdAt: new Date().toISOString() };
  return readJson(PROJECT, { title: "My Novel", genre: "", synopsis: "", createdAt: new Date().toISOString() });
});

ipcMain.handle("project:set", (_e, data: object) => {
  writeJson(dirs().PROJECT, data); return data;
});

// ─── CHAPTERS ────────────────────────────────────────────────────────────────
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

ipcMain.handle("chapters:list", () => {
  const { story, work } = dirs();
  ensureDir(story);
  return fs.readdirSync(story).filter((f) => f.endsWith(".md")).sort().map((f) => {
    const slug = f.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(story, f), "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    return { slug, title: meta.title || slug, brief: meta.brief || "", order: parseInt(meta.order || "0"), wordCount: body.trim() ? body.trim().split(/\s+/).length : 0, updatedAt: meta.updatedAt || new Date().toISOString(), hasVoiceDraft: fs.existsSync(path.join(work, "drafts", `${slug}.md`)) };
  }).sort((a, b) => a.order - b.order);
});

ipcMain.handle("chapters:get", (_e, slug: string) => {
  const { story } = dirs();
  const file = path.join(story, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const { meta, body } = parseFrontmatter(fs.readFileSync(file, "utf-8"));
  return { slug, title: meta.title || slug, brief: meta.brief || "", order: parseInt(meta.order || "0"), content: body, updatedAt: meta.updatedAt || new Date().toISOString() };
});

ipcMain.handle("chapters:create", (_e, data: { title: string; brief?: string }) => {
  const { story } = dirs();
  ensureDir(story);
  const existing = fs.readdirSync(story).filter((f) => f.endsWith(".md")).length;
  const slug = `${String(existing + 1).padStart(2, "0")}-${data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const now = new Date().toISOString();
  fs.writeFileSync(path.join(story, `${slug}.md`), buildFrontmatter({ title: data.title, brief: data.brief || "", order: String(existing), updatedAt: now }, ""));
  return { slug };
});

ipcMain.handle("chapters:save", (_e, slug: string, content: string, meta?: Record<string, string>) => {
  const { story } = dirs();
  const file = path.join(story, `${slug}.md`);
  const existing = fs.existsSync(file) ? parseFrontmatter(fs.readFileSync(file, "utf-8")).meta : {};
  fs.writeFileSync(file, buildFrontmatter({ ...existing, ...(meta || {}), updatedAt: new Date().toISOString() }, content));
  return { ok: true };
});

ipcMain.handle("chapters:delete", (_e, slug: string) => {
  const file = path.join(dirs().story, `${slug}.md`);
  if (fs.existsSync(file)) fs.unlinkSync(file);
  return { ok: true };
});

// ─── KNOWLEDGE BASE ───────────────────────────────────────────────────────────
function walkKb(dir: string, base: string): object[] {
  const results: object[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(base, full).replace(/\\/g, "/");
    if (entry.isDirectory()) results.push(...walkKb(full, base) as object[]);
    else if (entry.name.endsWith(".md")) {
      const cat = rel.split("/")[0];
      results.push({ path: rel, name: entry.name.replace(/\.md$/, ""), category: ["characters","world","style","continuity"].includes(cat) ? cat : "other", updatedAt: fs.statSync(full).mtime.toISOString() });
    }
  }
  return results;
}

ipcMain.handle("kb:list", () => walkKb(dirs().kb, dirs().kb));
ipcMain.handle("kb:get", (_e, kbPath: string) => { const f = path.join(dirs().kb, kbPath); return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : null; });
ipcMain.handle("kb:save", (_e, kbPath: string, content: string) => { const f = path.join(dirs().kb, kbPath); ensureDir(path.dirname(f)); fs.writeFileSync(f, content); return { ok: true }; });
ipcMain.handle("kb:delete", (_e, kbPath: string) => { const f = path.join(dirs().kb, kbPath); if (fs.existsSync(f)) fs.unlinkSync(f); return { ok: true }; });
ipcMain.handle("kb:create", (_e, kbPath: string, name: string) => { const f = path.join(dirs().kb, kbPath, `${name.toLowerCase().replace(/\s+/g, "-")}.md`); ensureDir(path.dirname(f)); if (!fs.existsSync(f)) fs.writeFileSync(f, `# ${name}\n\n`); return path.relative(dirs().kb, f).replace(/\\/g, "/"); });

// ─── ENTITIES ────────────────────────────────────────────────────────────────
function readEntities(type?: string) {
  const { entities } = dirs(); ensureDir(entities);
  const results: object[] = [];
  const types = type ? [type] : (fs.existsSync(entities) ? fs.readdirSync(entities).filter((f) => !f.startsWith("_") && fs.statSync(path.join(entities, f)).isDirectory()) : []);
  for (const t of types) { const dir = path.join(entities, t); if (!fs.existsSync(dir)) continue; for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) { try { results.push(readJson(path.join(dir, f), {})); } catch { /* skip */ } } }
  return results;
}

ipcMain.handle("entities:list", (_e, type?: string) => readEntities(type));
ipcMain.handle("entities:get", (_e, id: string) => (readEntities() as Array<{ id: string }>).find((e) => e.id === id) ?? null);
ipcMain.handle("entities:save", (_e, entity: { id?: string; type: string; slug: string; [k: string]: unknown }) => {
  const { entities } = dirs(); const now = new Date().toISOString();
  const full = { ...entity, id: entity.id || uuidv4(), created_at: (entity.created_at as string) || now, updated_at: now, version: ((entity.version as number) ?? 0) + 1 };
  ensureDir(path.join(entities, entity.type)); writeJson(path.join(entities, entity.type, `${entity.slug}.json`), full); return full;
});
ipcMain.handle("entities:delete", (_e, id: string) => {
  const entity = (readEntities() as Array<{ id: string; type: string; slug: string }>).find((e) => e.id === id); if (!entity) return { ok: false };
  const file = path.join(dirs().entities, entity.type, `${entity.slug}.json`); if (fs.existsSync(file)) fs.unlinkSync(file); return { ok: true };
});

// ─── RELATIONSHIPS ───────────────────────────────────────────────────────────
function getGraph() { return readJson<{ relationships: object[] }>(dirs().GRAPH, { relationships: [] }); }

ipcMain.handle("relationships:list", (_e, entityId?: string) => {
  const rels = getGraph().relationships as Array<{ source_id: string; target_id: string }>;
  return entityId ? rels.filter((r) => r.source_id === entityId || r.target_id === entityId) : rels;
});
ipcMain.handle("relationships:create", (_e, rel: object) => { const g = getGraph(); const full = { ...rel, id: uuidv4(), created_at: new Date().toISOString() }; g.relationships.push(full); writeJson(dirs().GRAPH, g); return full; });
ipcMain.handle("relationships:delete", (_e, id: string) => { const g = getGraph(); g.relationships = (g.relationships as Array<{ id: string }>).filter((r) => r.id !== id); writeJson(dirs().GRAPH, g); return { ok: true }; });

// ─── ASSETS ─────────────────────────────────────────────────────────────────
ipcMain.handle("assets:list", (_e, entityId?: string) => { const s = readJson<{ assets: Array<{ entity_id?: string }> }>(dirs().ASSETS_IDX, { assets: [] }); return entityId ? s.assets.filter((a) => a.entity_id === entityId) : s.assets; });
ipcMain.handle("assets:save", (_e, assetMeta: object, fileBuffer: ArrayBuffer, filename: string, subdir: string) => {
  const { assets, ASSETS_IDX } = dirs(); const ts = Date.now(); const safe = filename.replace(/[^a-z0-9._-]/gi, "_"); const sp = `${subdir}/${ts}-${safe}`; const fp = path.join(assets, sp);
  ensureDir(path.dirname(fp)); fs.writeFileSync(fp, Buffer.from(fileBuffer));
  const store = readJson<{ assets: object[] }>(ASSETS_IDX, { assets: [] }); const full = { ...assetMeta, id: uuidv4(), storage_path: sp, created_at: new Date().toISOString() }; store.assets.push(full); writeJson(ASSETS_IDX, store); return full;
});
ipcMain.handle("assets:delete", (_e, id: string) => {
  const { assets, ASSETS_IDX } = dirs(); const s = readJson<{ assets: Array<{ id: string; storage_path: string }> }>(ASSETS_IDX, { assets: [] });
  const a = s.assets.find((x) => x.id === id); if (a) { const fp = path.join(assets, a.storage_path); if (fs.existsSync(fp)) fs.unlinkSync(fp); }
  s.assets = s.assets.filter((x) => x.id !== id); writeJson(ASSETS_IDX, s); return { ok: true };
});

// ─── SKILLS ────────────────────────────────────────────────────────────────
ipcMain.handle("skills:list", () => {
  const skillsDir = path.join(dirs().config, "..", ".claude", "skills");
  if (!fs.existsSync(skillsDir)) return [];
  return fs.readdirSync(skillsDir, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      const id = dirent.name;
      const title = id.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
      return { id, title };
    });
});

// ─── PROVIDERS ───────────────────────────────────────────────────────────────
const BUILT_IN_PROVIDERS = [
  { id: "claude-code", name: "Claude Code (Pro)", command: "claude", args: ["--print", "--output-format", "text"], type: "claude-code", capabilities: ["write","summarize","analyze","critique","extract"], maxContextTokens: 200000, costTier: "pro", streamOutput: false, promptFormat: "raw", enabled: true },
  { id: "ollama-llama3", name: "Ollama (llama3)", command: "ollama", args: ["run","llama3"], type: "ollama", capabilities: ["write","summarize","analyze"], maxContextTokens: 8192, costTier: "free", streamOutput: true, promptFormat: "raw", enabled: false },
  { id: "gemini-cli", name: "Gemini CLI (Pro)", command: "gemini", args: [], type: "gemini-cli", capabilities: ["write","summarize","analyze","critique","extract"], maxContextTokens: 1000000, costTier: "pro", streamOutput: false, promptFormat: "raw", enabled: true },
];

function getProviderConfig() { const f = path.join(dirs().config, "providers.json"); try { if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, "utf-8")); } catch { /* defaults */ } return { providers: BUILT_IN_PROVIDERS, defaultProviders: { write: "claude-code", summarize: "claude-code", analyze: "claude-code", critique: "claude-code", extract: "claude-code" } }; }

ipcMain.handle("providers:get", () => getProviderConfig());
ipcMain.handle("providers:set", (_e, config: object) => { const f = path.join(dirs().config, "providers.json"); ensureDir(path.dirname(f)); fs.writeFileSync(f, JSON.stringify(config, null, 2)); return { ok: true }; });
ipcMain.handle("providers:check", (_e, providerId: string) => {
  const cfg = getProviderConfig() as { providers: Array<{ id: string; command: string }> };
  const p = cfg.providers.find((x) => x.id === providerId); if (!p) return { available: false };
  return new Promise<{ available: boolean }>((res) => { execFile(p.command, ["--version"], { timeout: 5000, shell: process.platform === "win32" }, (err) => res({ available: !err })); });
});
