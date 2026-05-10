import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, KbEntry } from "../lib/api";
import { useAI } from "../lib/context/AIContext";

const CATEGORY_COLORS: Record<string, string> = { characters: "#c9a84c", world: "#7eb8c9", style: "#b89ecc", continuity: "#90c97e", other: "#888" };
const CATEGORY_LABELS: Record<string, string> = { characters: "Characters", world: "World & lore", style: "Voice & style", continuity: "Continuity", other: "Other" };

export default function KBPage() {
  const [entries, setEntries] = useState<KbEntry[]>([]);
  const [selected, setSelected] = useState<KbEntry | null>(null);
  const [content, setContent] = useState("");
  const [saved, setSaved] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newCat, setNewCat] = useState("characters");
  const [newName, setNewName] = useState("");
  const { isPanelOpen, setPanelOpen, sendMessage } = useAI();

  useEffect(() => { loadEntries(); }, []);

  async function loadEntries() { setEntries(await api.kbList()); }

  async function loadEntry(entry: KbEntry) {
    setSelected(entry);
    const text = await api.kbGet(entry.path);
    setContent(text || ""); setSaved(true);
  }

  async function saveEntry() {
    if (!selected) return;
    await api.kbSave(selected.path, content);
    setSaved(true); loadEntries();
  }

  async function deleteEntry(entry: KbEntry) {
    if (!confirm(`Delete ${entry.name}?`)) return;
    await api.kbDelete(entry.path);
    if (selected?.path === entry.path) { setSelected(null); setContent(""); }
    loadEntries();
  }

  async function createEntry() {
    if (!newName.trim()) return;
    const kbPath = await api.kbCreate(newCat, newName.trim());
    setCreating(false); setNewName("");
    await loadEntries();
    const updated = await api.kbList();
    const newEntry = updated.find((e) => e.path === kbPath);
    if (newEntry) loadEntry(newEntry);
  }

  const grouped = entries.reduce<Record<string, KbEntry[]>>((acc, e) => {
    (acc[e.category] = acc[e.category] || []).push(e); return acc;
  }, {});

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ borderBottom: "1px solid var(--border)" }} className="flex items-center justify-between px-6 py-4 shrink-0">
        <div className="flex items-center gap-4">
          <Link to="/" style={{ color: "var(--accent)" }} className="text-base tracking-widest uppercase font-bold">Bookmoth</Link>
          <div style={{ color: "var(--muted)" }} className="text-xs flex items-center gap-3">
            <Link to="/manuscript" className="hover:opacity-80">Manuscript</Link>
            <span>·</span>
            <span style={{ color: "var(--text)" }} className="font-bold">Knowledge base</span>
          </div>
        </div>
        <button
          onClick={() => setPanelOpen(!isPanelOpen)}
          title="Toggle AI panel"
          style={{
            border: "1px solid var(--border)",
            background: isPanelOpen ? "var(--accent)" : "transparent",
            color: isPanelOpen ? "#000" : "var(--muted)",
          }}
          className="text-xs px-3 py-1 rounded hover:opacity-80 font-bold"
        >
          AI
        </button>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside style={{ borderRight: "1px solid var(--border)", background: "var(--surface)", width: "240px", minWidth: "240px" }} className="flex flex-col overflow-y-auto">
          <div style={{ borderBottom: "1px solid var(--border)" }} className="p-4">
            <button onClick={() => setCreating(true)} style={{ background: "var(--accent)", color: "#000", width: "100%" }} className="text-xs py-2 rounded font-bold">+ New entry</button>
          </div>

          {creating && (
            <div style={{ borderBottom: "1px solid var(--border)" }} className="p-4">
              <select value={newCat} onChange={(e) => setNewCat(e.target.value)}
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", width: "100%" }}
                className="px-3 py-1.5 rounded text-xs outline-none mb-2">
                {Object.keys(CATEGORY_LABELS).map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
              </select>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus placeholder="Name"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", width: "100%" }}
                className="px-3 py-1.5 rounded text-xs outline-none focus:border-amber-600 mb-2"
                onKeyDown={(e) => e.key === "Enter" && createEntry()} />
              <div className="flex gap-2">
                <button onClick={createEntry} style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-3 py-1.5 rounded font-bold">Create</button>
                <button onClick={() => { setCreating(false); setNewName(""); }} style={{ color: "var(--muted)" }} className="text-xs px-2">Cancel</button>
              </div>
            </div>
          )}

          {Object.keys(CATEGORY_LABELS).map((cat) => {
            const items = grouped[cat];
            if (!items?.length) return null;
            return (
              <div key={cat} style={{ borderBottom: "1px solid var(--border)" }} className="p-3">
                <p style={{ color: CATEGORY_COLORS[cat] }} className="text-xs font-bold uppercase tracking-widest mb-2">{CATEGORY_LABELS[cat]}</p>
                {items.map((entry) => (
                  <div key={entry.path} className="flex items-center group">
                    <button onClick={() => loadEntry(entry)} style={{ color: selected?.path === entry.path ? "var(--text)" : "var(--muted)" }}
                      className="flex-1 text-left text-sm py-1 hover:opacity-80 truncate">{entry.name}</button>
                    <button onClick={() => deleteEntry(entry)} style={{ color: "var(--muted)" }} className="text-xs opacity-0 group-hover:opacity-100 hover:text-red-400 px-1 shrink-0">×</button>
                  </div>
                ))}
              </div>
            );
          })}

          {entries.length === 0 && !creating && (
            <p style={{ color: "var(--muted)" }} className="text-xs p-4 leading-relaxed">
              No KB entries yet. Use <code style={{ color: "var(--text)" }}>/kb</code> in Claude Code or create one manually.
            </p>
          )}

          <div style={{ borderTop: "1px solid var(--border)", color: "var(--muted)" }} className="p-4 mt-auto text-xs">
            <button
              onClick={() => sendMessage("/kb")}
              className="flex flex-col text-left hover:opacity-80 transition-opacity"
            >
              <p className="mb-1">Claude Code: <code style={{ color: "var(--accent)" }}>/kb</code></p>
              <p>Files: <code style={{ color: "var(--text)" }}>kb/**/*.md</code></p>
            </button>
          </div>
        </aside>

        {selected ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div style={{ borderBottom: "1px solid var(--border)" }} className="flex items-center justify-between px-6 py-3 shrink-0">
              <div className="flex items-center gap-3">
                <span style={{ color: CATEGORY_COLORS[selected.category] }} className="text-xs font-bold uppercase tracking-widest">{CATEGORY_LABELS[selected.category]}</span>
                <span style={{ color: "var(--border)" }}>/</span>
                <span className="text-sm">{selected.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span style={{ color: saved ? "var(--muted)" : "var(--accent)" }} className="text-xs">{saved ? "Saved" : "Unsaved"}</span>
                <button onClick={saveEntry} style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-4 py-1.5 rounded font-bold">Save</button>
              </div>
            </div>
            <textarea value={content} onChange={(e) => { setContent(e.target.value); setSaved(false); }}
              style={{ background: "var(--bg)", color: "var(--text)", border: "none", resize: "none", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "0.95rem", lineHeight: "1.8", flex: 1 }}
              className="w-full px-16 py-10 outline-none" spellCheck={false} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p style={{ color: "var(--muted)" }} className="text-lg mb-4">Select a KB entry to edit</p>
              <button
                onClick={() => sendMessage("/kb")}
                className="text-sm hover:opacity-80"
                style={{ color: "var(--muted)" }}
              >
                Or use <code style={{ color: "var(--accent)" }}>/kb</code> in Claude Code.
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
