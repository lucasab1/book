import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { api, Entity, Relationship, EntityType, ENTITY_TYPES } from "../lib/api";

const TYPE_LABELS: Record<EntityType, string> = { character: "Character", location: "Location", faction: "Faction", race: "Race", nation: "Nation", religion: "Religion", magic_system: "Magic System", skill: "Skill", item: "Item", creature: "Creature", event: "Event", arc: "Arc", scene: "Scene", timeline: "Timeline", relationship: "Relationship", lore: "Lore" };

export default function EntityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [rels, setRels] = useState<Relationship[]>([]);
  const [allEntities, setAllEntities] = useState<Entity[]>([]);
  const [tab, setTab] = useState<"overview" | "content" | "relationships">("overview");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Entity>>({});
  const [saving, setSaving] = useState(false);
  const [showAddRel, setShowAddRel] = useState(false);
  const [relTarget, setRelTarget] = useState("");
  const [relType, setRelType] = useState("knows");
  const [relBidirectional, setRelBidirectional] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([api.entitiesGet(id), api.relationshipsList(id), api.entitiesList()]).then(([e, rs, all]) => {
      if (!e) { navigate("/world"); return; }
      setEntity(e); setForm(e); setRels(rs); setAllEntities(all);
    });
  }, [id, navigate]);

  const save = useCallback(async () => {
    if (!entity) return;
    setSaving(true);
    const updated = await api.entitiesSave({ ...entity, ...form, id: entity.id });
    setEntity(updated); setForm(updated); setEditing(false); setSaving(false);
  }, [entity, form]);

  async function deleteEntity() {
    if (!confirm("Delete this entity?")) return;
    await api.entitiesDelete(id!);
    navigate("/world");
  }

  async function addRel() {
    if (!relTarget || !entity) return;
    const target = allEntities.find((e) => e.id === relTarget); if (!target) return;
    const rel = await api.relationshipsCreate({ source_id: entity.id, source_name: entity.name, target_id: target.id, target_name: target.name, type: relType, bidirectional: relBidirectional, weight: 0.5, metadata: {} });
    setRels((p) => [...p, rel]); setShowAddRel(false); setRelTarget(""); setRelType("knows");
  }

  async function deleteRel(relId: string) {
    await api.relationshipsDelete(relId);
    setRels((p) => p.filter((r) => r.id !== relId));
  }

  if (!entity) return <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">Loading…</div>;

  return (
    <div className="flex-1 overflow-y-auto">
      <nav style={{ borderBottom: "1px solid var(--border)" }} className="flex items-center gap-3 px-6 py-3">
        <Link to="/world" style={{ color: "var(--muted)" }} className="text-xs hover:opacity-80">World</Link>
        <span style={{ color: "var(--muted)" }} className="text-xs">→</span>
        <span style={{ color: "var(--accent)" }} className="text-xs uppercase tracking-widest">{TYPE_LABELS[entity.type]}</span>
        <span style={{ color: "var(--muted)" }} className="text-xs">→</span>
        <span className="text-xs font-bold">{entity.name}</span>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="flex flex-col gap-3">
                <input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                  className="text-3xl font-bold px-3 py-2 rounded outline-none focus:border-amber-600 w-full" />
                <div className="flex gap-3 items-center">
                  <select value={form.type || entity.type} onChange={(e) => setForm({ ...form, type: e.target.value as EntityType })}
                    style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }} className="text-sm px-3 py-1.5 rounded outline-none">
                    {ENTITY_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
                  </select>
                  <label className="text-xs flex items-center gap-2" style={{ color: "var(--muted)" }}>
                    Importance
                    <input type="range" min={1} max={10} step={1} value={form.importance ?? 5} onChange={(e) => setForm({ ...form, importance: Number(e.target.value) })} />
                    <span style={{ color: "var(--accent)" }} className="font-bold w-4">{form.importance ?? 5}</span>
                  </label>
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold mb-1">{entity.name}</h1>
                <div className="flex items-center gap-3">
                  <span style={{ color: "var(--accent)" }} className="text-xs uppercase tracking-widest">{TYPE_LABELS[entity.type]}</span>
                  <span style={{ color: "var(--muted)" }} className="text-xs">importance: {entity.importance}/10</span>
                  <span style={{ color: "var(--muted)" }} className="text-xs">v{entity.version}</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-4 shrink-0">
            {editing ? (
              <><button onClick={save} disabled={saving} style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-4 py-2 rounded font-bold disabled:opacity-50">{saving ? "Saving…" : "Save"}</button>
              <button onClick={() => { setEditing(false); setForm(entity); }} style={{ color: "var(--muted)" }} className="text-xs px-3 py-2">Cancel</button></>
            ) : (
              <><button onClick={() => setEditing(true)} style={{ border: "1px solid var(--border)", color: "var(--text)" }} className="text-xs px-4 py-2 rounded hover:opacity-80">Edit</button>
              <button onClick={deleteEntity} style={{ color: "var(--muted)" }} className="text-xs px-3 py-2 hover:text-red-400">Delete</button></>
            )}
          </div>
        </div>

        <div style={{ borderBottom: "1px solid var(--border)" }} className="flex gap-1 mb-8">
          {(["overview", "content", "relationships"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ color: tab === t ? "var(--text)" : "var(--muted)", borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent" }} className="text-sm px-4 py-2 capitalize font-medium">
              {t}{t === "relationships" && rels.length > 0 && <span style={{ color: "var(--accent)" }} className="ml-1 text-xs">({rels.length})</span>}
            </button>
          ))}
        </div>

        {tab === "overview" && (
          <div className="flex flex-col gap-6">
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-6">
              <h2 className="font-bold mb-3 text-sm">Description</h2>
              {editing ? <textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", resize: "vertical" }} className="w-full px-3 py-2 rounded text-sm outline-none focus:border-amber-600 leading-relaxed" />
                : <p style={{ color: entity.description ? "var(--text)" : "var(--muted)" }} className="text-sm leading-relaxed">{entity.description || "No description yet."}</p>}
            </div>
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-6">
              <h2 className="font-bold mb-3 text-sm">Tags</h2>
              {editing ? <input value={(form.tags || []).join(", ")} onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })} placeholder="comma-separated tags" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)" }} className="w-full px-3 py-2 rounded text-sm outline-none focus:border-amber-600" />
                : entity.tags.length > 0 ? <div className="flex gap-2 flex-wrap">{entity.tags.map((t) => <span key={t} style={{ background: "var(--surface2)", color: "var(--muted)" }} className="text-xs px-2 py-1 rounded">{t}</span>)}</div>
                : <p style={{ color: "var(--muted)" }} className="text-sm">No tags.</p>}
            </div>
            <div style={{ color: "var(--muted)" }} className="text-xs flex gap-6">
              <span>Created {new Date(entity.created_at).toLocaleString()}</span>
              <span>Updated {new Date(entity.updated_at).toLocaleString()}</span>
              <span>Slug: <code>{entity.slug}</code></span>
            </div>
          </div>
        )}

        {tab === "content" && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-6">
            <h2 className="font-bold mb-3 text-sm">Rich content (Markdown)</h2>
            {editing ? <textarea value={form.rich_content || ""} onChange={(e) => setForm({ ...form, rich_content: e.target.value })} rows={24} placeholder="Write detailed lore, backstory, or notes…"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", resize: "vertical", fontFamily: "Georgia, serif" }}
              className="w-full px-4 py-3 rounded text-sm outline-none focus:border-amber-600 leading-relaxed" />
              : entity.rich_content ? <div style={{ fontFamily: "Georgia, serif", lineHeight: "1.8" }} className="text-sm whitespace-pre-wrap">{entity.rich_content}</div>
              : <p style={{ color: "var(--muted)" }} className="text-sm">No content yet. Click Edit to add notes, lore, or backstory.</p>}
            {editing && <button onClick={save} disabled={saving} style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-4 py-2 rounded font-bold disabled:opacity-50 mt-4">{saving ? "Saving…" : "Save"}</button>}
          </div>
        )}

        {tab === "relationships" && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold">{rels.length} connection{rels.length !== 1 ? "s" : ""}</h2>
              <button onClick={() => setShowAddRel(true)} style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-4 py-2 rounded font-bold">+ Add connection</button>
            </div>
            {showAddRel && (
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-5">
                <h3 className="font-bold mb-4 text-sm">New connection</h3>
                <div className="flex gap-3 mb-3">
                  <select value={relTarget} onChange={(e) => setRelTarget(e.target.value)} style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", flex: 2 }} className="px-3 py-2 rounded text-sm outline-none">
                    <option value="">Select entity…</option>
                    {allEntities.filter((e) => e.id !== entity.id).map((e) => <option key={e.id} value={e.id}>{e.name} ({TYPE_LABELS[e.type]})</option>)}
                  </select>
                  <input value={relType} onChange={(e) => setRelType(e.target.value)} placeholder="type (e.g. knows)" style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", flex: 2 }} className="px-3 py-2 rounded text-sm outline-none focus:border-amber-600" />
                </div>
                <label className="flex items-center gap-2 text-xs mb-4" style={{ color: "var(--muted)" }}>
                  <input type="checkbox" checked={relBidirectional} onChange={(e) => setRelBidirectional(e.target.checked)} /> Bidirectional
                </label>
                <div className="flex gap-3">
                  <button onClick={addRel} style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-4 py-2 rounded font-bold">Add</button>
                  <button onClick={() => setShowAddRel(false)} style={{ color: "var(--muted)" }} className="text-xs px-3 py-2">Cancel</button>
                </div>
              </div>
            )}
            {rels.length === 0 ? <div style={{ border: "1px dashed var(--border)" }} className="rounded-lg py-16 text-center"><p style={{ color: "var(--muted)" }} className="text-sm">No connections yet.</p></div>
              : <div className="flex flex-col gap-2">
                {rels.map((r) => {
                  const isSrc = r.source_id === entity.id;
                  return <div key={r.id} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm">{entity.name}</span>
                      <span style={{ color: "var(--accent)" }} className="text-xs mx-2">{r.bidirectional ? "↔" : "→"} {r.type}</span>
                      <Link to={`/world/entity/${isSrc ? r.target_id : r.source_id}`} className="font-bold text-sm hover:opacity-80">{isSrc ? r.target_name : r.source_name}</Link>
                    </div>
                    <button onClick={() => deleteRel(r.id)} style={{ color: "var(--muted)" }} className="text-xs hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">Remove</button>
                  </div>;
                })}
              </div>}
          </div>
        )}
      </main>
    </div>
  );
}
