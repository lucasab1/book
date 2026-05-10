"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { Entity, Relationship, Asset } from "@/lib/entities/types";
import { ENTITY_TYPES, EntityType } from "@/lib/entities/types";

const REL_TYPES = [
  "knows", "enemy_of", "ally_of", "member_of", "leads", "lives_in",
  "created_by", "owns", "fears", "loves", "mentors", "betrayed_by",
  "born_in", "rules", "worships", "uses", "related_to",
];

export default function EntityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entity, setEntity] = useState<Entity | null>(null);
  const [rels, setRels] = useState<Relationship[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [allEntities, setAllEntities] = useState<Entity[]>([]);
  const [tab, setTab] = useState<"details" | "relationships" | "assets">("details");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Entity>>({});

  // New relationship form
  const [newRelTarget, setNewRelTarget] = useState("");
  const [newRelType, setNewRelType] = useState("knows");

  useEffect(() => {
    fetch(`/api/entities/${id}`).then((r) => r.ok ? r.json() : null).then((e) => {
      if (!e) { router.push("/world"); return; }
      setEntity(e);
      setForm({ name: e.name, description: e.description, tags: e.tags, importance: e.importance, rich_content: e.rich_content });
    });
    fetch(`/api/relationships?entityId=${id}`).then((r) => r.json()).then(setRels);
    fetch(`/api/assets?entityId=${id}`).then((r) => r.json()).then(setAssets);
    fetch("/api/entities").then((r) => r.json()).then(setAllEntities);
  }, [id, router]);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/entities/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const updated = await res.json();
    setEntity(updated);
    setSaving(false);
  }

  async function addRelationship() {
    const target = allEntities.find((e) => e.id === newRelTarget);
    if (!target || !entity) return;
    await fetch("/api/relationships", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source_id: entity.id,
        source_name: entity.name,
        target_id: target.id,
        target_name: target.name,
        type: newRelType,
        bidirectional: false,
      }),
    });
    fetch(`/api/relationships?entityId=${id}`).then((r) => r.json()).then(setRels);
    setNewRelTarget("");
  }

  async function deleteRel(relId: string) {
    await fetch(`/api/relationships/${relId}`, { method: "DELETE" });
    setRels((prev) => prev.filter((r) => r.id !== relId));
  }

  async function deleteEntity() {
    if (!confirm("Delete this entity?")) return;
    await fetch(`/api/entities/${id}`, { method: "DELETE" });
    router.push("/world");
  }

  async function uploadAsset(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !entity) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", "portrait");
    fd.append("entityId", entity.id);
    await fetch("/api/assets", { method: "POST", body: fd });
    fetch(`/api/assets?entityId=${id}`).then((r) => r.json()).then(setAssets);
  }

  if (!entity) return (
    <div style={{ background: "var(--bg)", color: "var(--muted)", minHeight: "100vh" }} className="flex items-center justify-center text-sm">
      Loading…
    </div>
  );

  return (
    <div style={{ background: "var(--bg)", color: "var(--text)", minHeight: "100vh" }}>
      <AppNav />
      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* Breadcrumb */}
        <div style={{ color: "var(--muted)" }} className="text-xs mb-6 flex items-center gap-2">
          <Link href="/world" className="hover:opacity-80">World</Link>
          <span>/</span>
          <span style={{ color: "var(--accent)", textTransform: "capitalize" }}>{entity.type}</span>
          <span>/</span>
          <span>{entity.name}</span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <input
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              style={{ background: "transparent", border: "none", color: "var(--text)", fontSize: "2rem", fontWeight: "bold" }}
              className="outline-none w-full mb-1"
            />
            <span style={{ background: "var(--surface2)", color: "var(--accent)" }} className="text-xs px-2 py-1 rounded font-bold uppercase tracking-widest">
              {entity.type.replace("_", " ")}
            </span>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={save} disabled={saving} style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-4 py-2 rounded font-bold disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
            <button onClick={deleteEntity} style={{ color: "var(--muted)" }} className="text-xs px-3 py-2 hover:text-red-400">
              Delete
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ borderBottom: "1px solid var(--border)" }} className="flex gap-1 mb-8">
          {(["details", "relationships", "assets"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent",
                color: tab === t ? "var(--text)" : "var(--muted)",
              }}
              className="px-4 py-3 text-sm font-bold capitalize"
            >
              {t} {t === "relationships" && rels.length > 0 && `(${rels.length})`}
              {t === "assets" && assets.length > 0 && `(${assets.length})`}
            </button>
          ))}
        </div>

        {/* Details tab */}
        {tab === "details" && (
          <div className="flex flex-col gap-6">
            <label className="flex flex-col gap-2">
              <span style={{ color: "var(--accent)" }} className="text-xs font-bold uppercase tracking-widest">Description</span>
              <textarea
                value={form.description || ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)", resize: "vertical" }}
                className="px-4 py-3 rounded text-sm outline-none focus:border-amber-600 leading-relaxed"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span style={{ color: "var(--accent)" }} className="text-xs font-bold uppercase tracking-widest">
                Notes <span style={{ color: "var(--muted)" }} className="normal-case font-normal">(Markdown)</span>
              </span>
              <textarea
                value={form.rich_content || ""}
                onChange={(e) => setForm({ ...form, rich_content: e.target.value })}
                rows={12}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  resize: "vertical",
                  fontFamily: "Georgia, serif",
                  lineHeight: "1.7",
                }}
                className="px-4 py-3 rounded text-sm outline-none focus:border-amber-600"
              />
            </label>

            <div className="flex gap-6">
              <label className="flex flex-col gap-2 flex-1">
                <span style={{ color: "var(--accent)" }} className="text-xs font-bold uppercase tracking-widest">Tags (comma-separated)</span>
                <input
                  value={(form.tags || []).join(", ")}
                  onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                  className="px-4 py-2 rounded text-sm outline-none focus:border-amber-600"
                />
              </label>
              <label className="flex flex-col gap-2 w-32">
                <span style={{ color: "var(--accent)" }} className="text-xs font-bold uppercase tracking-widest">Importance</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={form.importance || 5}
                  onChange={(e) => setForm({ ...form, importance: parseInt(e.target.value) })}
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
                  className="px-4 py-2 rounded text-sm outline-none focus:border-amber-600"
                />
              </label>
            </div>
          </div>
        )}

        {/* Relationships tab */}
        {tab === "relationships" && (
          <div>
            <div className="flex flex-col gap-2 mb-8">
              {rels.length === 0 && <p style={{ color: "var(--muted)" }} className="text-sm py-4">No relationships yet.</p>}
              {rels.map((r) => {
                const isSource = r.source_id === id;
                const otherName = isSource ? r.target_name : r.source_name;
                const otherId = isSource ? r.target_id : r.source_id;
                return (
                  <div key={r.id} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded p-4 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{entity.name}</span>
                      <span style={{ background: "var(--surface2)", color: "var(--accent)" }} className="text-xs px-2 py-0.5 rounded font-bold">
                        {r.type}
                      </span>
                      <Link href={`/world/entity/${otherId}`} className="font-bold hover:opacity-80">{otherName}</Link>
                    </div>
                    <button onClick={() => deleteRel(r.id)} style={{ color: "var(--muted)" }} className="text-xs opacity-0 group-hover:opacity-100 hover:text-red-400">
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add relationship */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded-lg p-5">
              <h3 className="font-bold mb-4 text-sm">Add relationship</h3>
              <div className="flex gap-3">
                <select
                  value={newRelTarget}
                  onChange={(e) => setNewRelTarget(e.target.value)}
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", flex: 2 }}
                  className="px-3 py-2 rounded text-sm outline-none focus:border-amber-600"
                >
                  <option value="">Select entity…</option>
                  {allEntities.filter((e) => e.id !== id).map((e) => (
                    <option key={e.id} value={e.id}>{e.name} ({e.type})</option>
                  ))}
                </select>
                <select
                  value={newRelType}
                  onChange={(e) => setNewRelType(e.target.value)}
                  style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", flex: 1 }}
                  className="px-3 py-2 rounded text-sm outline-none focus:border-amber-600"
                >
                  {REL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
                <button
                  onClick={addRelationship}
                  disabled={!newRelTarget}
                  style={{ background: "var(--accent)", color: "#000" }}
                  className="text-xs px-4 py-2 rounded font-bold disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assets tab */}
        {tab === "assets" && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {assets.map((a) => (
                <div key={a.id} style={{ background: "var(--surface)", border: "1px solid var(--border)" }} className="rounded overflow-hidden">
                  <div style={{ background: "var(--surface2)", height: 120 }} className="flex items-center justify-center text-4xl">
                    {a.mime_type.startsWith("image/") ? "🖼" : "📄"}
                  </div>
                  <p className="text-xs p-2 truncate" style={{ color: "var(--muted)" }}>{a.filename}</p>
                </div>
              ))}
            </div>
            <label style={{ border: "1px dashed var(--border)", color: "var(--muted)" }} className="flex flex-col items-center justify-center py-12 rounded-lg cursor-pointer hover:border-amber-700 transition-colors">
              <span className="text-sm mb-1">Upload image</span>
              <span className="text-xs">portrait, reference, concept art…</span>
              <input type="file" accept="image/*" className="hidden" onChange={uploadAsset} />
            </label>
          </div>
        )}
      </main>
    </div>
  );
}
