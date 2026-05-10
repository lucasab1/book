import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { api, Entity, Relationship, EntityType } from "../lib/api";

const TYPE_COLORS: Record<EntityType, string> = { character: "#c9a84c", location: "#7eb8c9", faction: "#c97e7e", race: "#9e7ec9", nation: "#7ec97e", religion: "#c9b07e", magic_system: "#c97eb8", skill: "#7ec9b8", item: "#c9c97e", creature: "#c98c7e", event: "#7e9ec9", arc: "#c9a84c", scene: "#888", timeline: "#888", relationship: "#888", lore: "#a0a0a0" };

interface NodePos { id: string; x: number; y: number; vx: number; vy: number }

function forceLayout(ents: Entity[], rels: Relationship[], width: number, height: number) {
  const nodes: NodePos[] = ents.map((e, i) => ({
    id: e.id,
    x: width / 2 + (Math.random() - 0.5) * 100,
    y: height / 2 + (Math.random() - 0.5) * 100,
    vx: 0,
    vy: 0,
  }));

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  for (let i = 0; i < 100; i++) {
    // Repulsion
    for (let a = 0; a < nodes.length; a++) {
      for (let b = a + 1; b < nodes.length; b++) {
        const dx = nodes[b].x - nodes[a].x;
        const dy = nodes[b].y - nodes[a].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = 400 / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        nodes[a].vx -= fx; nodes[a].vy -= fy;
        nodes[b].vx += fx; nodes[b].vy += fy;
      }
    }

    // Attraction
    for (const r of rels) {
      const a = nodeMap.get(r.source_id), b = nodeMap.get(r.target_id);
      if (!a || !b) continue;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist - 100) * 0.05;
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      a.vx += fx; a.vy += fy;
      b.vx -= fx; b.vy -= fy;
    }

    // Center gravity
    for (const n of nodes) {
      n.vx += (width / 2 - n.x) * 0.01;
      n.vy += (height / 2 - n.y) * 0.01;
      n.x += n.vx; n.y += n.vy;
      n.vx *= 0.8; n.vy *= 0.8;
    }
  }

  return new Map(nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
}

export default function GraphPage() {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [rels, setRels] = useState<Relationship[]>([]);
  const [positions, setPositions] = useState<Map<string, { x: number; y: number }>>(new Map());
  const [selected, setSelected] = useState<string | null>(null);
  const [filter, setFilter] = useState<EntityType | "all">("all");
  const [dragging, setDragging] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const W = 900, H = 600;

  useEffect(() => {
    Promise.all([api.entitiesList(), api.relationshipsList()]).then(([ents, rs]) => {
      setEntities(ents); setRels(rs); setPositions(forceLayout(ents, rs, W, H));
    });
  }, []);

  const visible = entities.filter((e) => filter === "all" || e.type === filter);
  const visIds = new Set(visible.map((e) => e.id));
  const visRels = rels.filter((r) => visIds.has(r.source_id) && visIds.has(r.target_id));
  const selRels = selected ? rels.filter((r) => r.source_id === selected || r.target_id === selected) : [];
  const selectedEntity = selected ? entities.find((e) => e.id === selected) : null;
  const usedTypes = [...new Set(entities.map((e) => e.type))] as EntityType[];

  const onMouseDown = useCallback((id: string) => (e: React.MouseEvent) => { e.preventDefault(); setDragging(id); setSelected(id); }, []);
  const onMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!dragging || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    setPositions((p) => new Map([...p, [dragging, { x: (e.clientX - rect.left) * (W / rect.width), y: (e.clientY - rect.top) * (H / rect.height) }]]));
  }, [dragging]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 relative overflow-hidden">
          <div style={{ position: "absolute", top: 12, left: 12, zIndex: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button onClick={() => setFilter("all")} style={{ background: filter === "all" ? "var(--accent)" : "var(--surface)", color: filter === "all" ? "#000" : "var(--muted)", border: "1px solid var(--border)" }} className="text-xs px-3 py-1 rounded font-bold">All</button>
            {usedTypes.map((t) => <button key={t} onClick={() => setFilter(t)} style={{ background: filter === t ? TYPE_COLORS[t] : "var(--surface)", color: filter === t ? "#000" : "var(--muted)", border: "1px solid var(--border)" }} className="text-xs px-3 py-1 rounded font-bold capitalize">{t.replace("_", " ")}</button>)}
          </div>

          {entities.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center"><p style={{ color: "var(--muted)" }} className="mb-4">No entities yet.</p><Link to="/world" style={{ background: "var(--accent)", color: "#000" }} className="text-xs px-5 py-2 rounded font-bold">Add entities →</Link></div>
            </div>
          ) : (
            <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "100%", cursor: dragging ? "grabbing" : "default" }} onMouseMove={onMouseMove} onMouseUp={() => setDragging(null)} onMouseLeave={() => setDragging(null)}>
              {visRels.map((r) => {
                const a = positions.get(r.source_id), b = positions.get(r.target_id);
                if (!a || !b) return null;
                const hl = selected && (r.source_id === selected || r.target_id === selected);
                return <g key={r.id}><line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={hl ? "var(--accent)" : "var(--border)"} strokeWidth={hl ? 2 : 1} strokeOpacity={selected && !hl ? 0.2 : 0.8} /><text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2} textAnchor="middle" dy="-4" fill={hl ? "var(--accent)" : "var(--muted)"} fontSize="9" fontFamily="Georgia" opacity={selected && !hl ? 0.2 : 1}>{r.type}</text></g>;
              })}
              {visible.map((e) => {
                const p = positions.get(e.id); if (!p) return null;
                const color = TYPE_COLORS[e.type] || "#888";
                const isSel = e.id === selected;
                const isDim = selected && !isSel && !selRels.some((r) => r.source_id === e.id || r.target_id === e.id);
                const r = 8 + e.importance * 1.5;
                return <g key={e.id} transform={`translate(${p.x},${p.y})`} style={{ cursor: "grab", opacity: isDim ? 0.3 : 1 }} onMouseDown={onMouseDown(e.id)} onClick={() => setSelected(e.id === selected ? null : e.id)}>
                  <circle r={r} fill={color} stroke={isSel ? "#fff" : color} strokeWidth={isSel ? 2 : 0} fillOpacity={0.85} />
                  <text textAnchor="middle" dy={r + 12} fill="var(--text)" fontSize="11" fontFamily="Georgia" fontWeight="bold">{e.name.length > 14 ? e.name.slice(0, 12) + "…" : e.name}</text>
                </g>;
              })}
            </svg>
          )}
        </main>

        {selectedEntity && (
          <aside style={{ borderLeft: "1px solid var(--border)", background: "var(--surface)", width: "260px", minWidth: "260px" }} className="p-5 overflow-y-auto">
            <div style={{ width: 40, height: 40, background: (TYPE_COLORS[selectedEntity.type] || "#888") + "33", borderRadius: 8 }} className="flex items-center justify-center text-2xl mb-3">{selectedEntity.name[0]}</div>
            <h2 className="font-bold text-lg mb-1">{selectedEntity.name}</h2>
            <p style={{ color: "var(--accent)" }} className="text-xs uppercase tracking-widest mb-3">{selectedEntity.type.replace("_", " ")}</p>
            <p style={{ color: "var(--muted)" }} className="text-sm leading-relaxed mb-4">{selectedEntity.description || "No description."}</p>
            <p style={{ color: "var(--accent)" }} className="text-xs font-bold uppercase tracking-widest mb-2">Connections</p>
            <div className="flex flex-col gap-1 mb-6">
              {selRels.length === 0 && <p style={{ color: "var(--muted)" }} className="text-xs">No connections.</p>}
              {selRels.map((r) => {
                const isSrc = r.source_id === selectedEntity.id;
                return <button key={r.id} onClick={() => setSelected(isSrc ? r.target_id : r.source_id)} className="text-left hover:opacity-80">
                  <span style={{ color: "var(--muted)" }} className="text-xs">{r.type} → </span>
                  <span className="text-xs font-bold">{isSrc ? r.target_name : r.source_name}</span>
                </button>;
              })}
            </div>
            <Link to={`/world/entity/${selectedEntity.id}`} style={{ border: "1px solid var(--border)", color: "var(--text)" }} className="text-xs px-4 py-2 rounded font-bold block text-center hover:opacity-80">Open entity →</Link>
          </aside>
        )}
      </div>
    </div>
  );
}
