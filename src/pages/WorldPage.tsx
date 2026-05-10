import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppNav from "../components/AppNav";
import { api, Entity, EntityType, ENTITY_TYPES } from "../lib/api";

const TYPE_LABELS: Record<EntityType, string> = { character: "Characters", location: "Locations", faction: "Factions", race: "Races", nation: "Nations", religion: "Religions", magic_system: "Magic Systems", skill: "Skills", item: "Items", creature: "Creatures", event: "Events", arc: "Arcs", scene: "Scenes", timeline: "Timelines", relationship: "Relationships", lore: "Lore" };
const TYPE_ICONS: Record<EntityType, string> = { character: "◎", location: "◈", faction: "◇", race: "◉", nation: "▣", religion: "✦", magic_system: "⬡", skill: "◆", item: "◻", creature: "◬", event: "◈", arc: "◎", scene: "▪", timeline: "─", relationship: "↔", lore: "◫" };

function EntityCard({ entity }: { entity: Entity }) {
  return (
    <Link to={`/world/entity/${entity.id}`} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-4 flex gap-3 hover:border-amber-700 transition-colors group">
      <div style={{ background: "var(--surface2)", color: "var(--accent)", width: 40, height: 40, minWidth: 40 }} className="rounded flex items-center justify-center text-lg font-bold">
        {TYPE_ICONS[entity.type] ?? "◎"}
      </div>
      <div className="min-w-0">
        <h3 className="font-bold text-sm group-hover:opacity-80 truncate">{entity.name}</h3>
        <p style={{ color: "var(--muted)" }} className="text-xs mt-0.5 truncate">{entity.description || entity.type}</p>
        <div className="flex gap-2 mt-1 flex-wrap">
          {entity.tags.slice(0, 3).map((t) => <span key={t} style={{ background: "var(--surface2)", color: "var(--muted)" }} className="text-xs px-1.5 py-0.5 rounded">{t}</span>)}
        </div>
      </div>
      <div style={{ color: "var(--muted)" }} className="ml-auto text-xs shrink-0">{entity.importance}/10</div>
    </Link>
  );
}

export default function WorldPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [filter, setFilter] = useState<EntityType | "all">("all");
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<EntityType>("character");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => { load(); }, []);

  async function load() { setEntities(await api.entitiesList()); }

  async function createEntity() {
    if (!newName.trim()) return;
    const slug = `${newName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${Math.random().toString(36).slice(2, 8)}`;
    await api.entitiesSave({ type: newType, name: newName.trim(), slug, description: newDesc.trim(), rich_content: "", metadata: {}, tags: [], importance: 5, version: 0 });
    setNewName(""); setNewDesc(""); setShowNew(false); load();
  }

  const filtered = entities.filter((e) => {
    if (filter !== "all" && e.type !== filter) return false;
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const grouped = ENTITY_TYPES.reduce<Record<string, Entity[]>>((acc, t) => { acc[t] = filtered.filter((e) => e.type === t); return acc; }, {});
  const totalByType = ENTITY_TYPES.reduce<Record<string, number>>((acc, t) => { acc[t] = entities.filter((e) => e.type === t).length; return acc; }, {});

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <AppNav />
      <div className="flex h-[calc(100vh-49px)]">
        <aside style={{ borderRight: "1px solid var(--border)", background: "var(--surface)", width: "200px", minWidth: "200px" }} className="flex flex-col overflow-y-auto">
          <div className="p-3">
            <button onClick={() => setShowNew(true)} style={{ background: "var(--accent)", color: "#000" }} className="w-full text-xs py-2 rounded font-bold">+ New entity</button>
          </div>
          <div style={{ borderBottom: "1px solid var(--border)" }} />
          <button onClick={() => setFilter("all")} style={{ color: filter === "all" ? "var(--text)" : "var(--muted)", background: filter === "all" ? "var(--surface2)" : "transparent" }} className="text-left px-4 py-2 text-sm flex justify-between items-center">
            <span>All</span><span style={{ color: "var(--muted)" }} className="text-xs">{entities.length}</span>
          </button>
          {ENTITY_TYPES.map((t) => (
            <button key={t} onClick={() => setFilter(t)} style={{ color: filter === t ? "var(--text)" : "var(--muted)", background: filter === t ? "var(--surface2)" : "transparent" }} className="text-left px-4 py-1.5 text-xs flex justify-between items-center hover:opacity-80">
              <span className="flex items-center gap-2"><span style={{ color: "var(--accent)" }}>{TYPE_ICONS[t]}</span>{TYPE_LABELS[t]}</span>
              {totalByType[t] > 0 && <span style={{ color: "var(--muted)" }} className="text-xs">{totalByType[t]}</span>}
            </button>
          ))}
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entities…"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
              className="flex-1 px-4 py-2 rounded text-sm outline-none focus:border-amber-600" />
            <Link to="/world/graph" style={{ border: "1px solid var(--border)", color: "var(--muted)" }} className="text-xs px-4 py-2 rounded hover:opacity-80">Graph →</Link>
          </div>

          {showNew && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-5 mb-6">
              <h3 className="font-bold mb-4">New entity</h3>
              <div className="flex gap-3 mb-3">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Name" autoFocus
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", flex: 2 }}
                  className="px-3 py-2 rounded text-sm outline-none focus:border-amber-600" />
                <select value={newType} onChange={(e) => setNewType(e.target.value as EntityType)}
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", flex: 1 }}
                  className="px-3 py-2 rounded text-sm outline-none">
                  {ENTITY_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t].slice(0, -1)}</option>)}
                </select>
              </div>
              <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Short description (optional)"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }}
                className="w-full px-3 py-2 rounded text-sm outline-none focus:border-amber-600 mb-4"
                onKeyDown={(e) => e.key === "Enter" && createEntity()} />
              <div className="flex gap-3">
                <button onClick={createEntity} style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-5 py-2 rounded font-bold">Create</button>
                <button onClick={() => setShowNew(false)} style={{ color: "var(--muted)" }} className="text-xs px-3 py-2">Cancel</button>
              </div>
            </div>
          )}

          {filter === "all" ? (
            ENTITY_TYPES.filter((t) => grouped[t]?.length > 0).map((t) => (
              <div key={t} className="mb-8">
                <h2 style={{ color: "var(--accent)" }} className="text-xs font-bold uppercase tracking-widest mb-3">{TYPE_ICONS[t]} {TYPE_LABELS[t]}</h2>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">{grouped[t].map((e) => <EntityCard key={e.id} entity={e} />)}</div>
              </div>
            ))
          ) : (
            <div>
              <h2 style={{ color: "var(--accent)" }} className="text-xs font-bold uppercase tracking-widest mb-4">{TYPE_ICONS[filter as EntityType]} {TYPE_LABELS[filter as EntityType]}</h2>
              {filtered.length === 0 ? <p style={{ color: "var(--muted)" }} className="text-sm py-12 text-center">No entities yet.</p>
                : <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">{filtered.map((e) => <EntityCard key={e.id} entity={e} />)}</div>}
            </div>
          )}

          {entities.length === 0 && !showNew && (
            <div style={{ border: "1px dashed var(--border)" }} className="rounded-lg py-20 text-center">
              <p style={{ color: "var(--muted)" }} className="mb-4">No world entities yet.</p>
              <button onClick={() => setShowNew(true)} style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-6 py-2 rounded font-bold">Create your first entity</button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
