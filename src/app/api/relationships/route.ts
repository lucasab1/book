import { NextRequest, NextResponse } from "next/server";
import { getRelationships, addRelationship, traverseGraph, getEntityById } from "@/lib/entities/store";

export async function GET(req: NextRequest) {
  const entityId = req.nextUrl.searchParams.get("entityId");
  const expand = req.nextUrl.searchParams.get("expand") === "true";

  const rels = getRelationships(entityId ?? undefined);

  if (expand && entityId) {
    // Return full graph neighborhood (2 hops)
    const neighborhood = traverseGraph(entityId, 2);
    const entities = [...neighborhood].map((id) => getEntityById(id)).filter(Boolean);
    return NextResponse.json({ relationships: rels, entities });
  }

  return NextResponse.json(rels);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { source_id, source_name, target_id, target_name, type, label, weight, bidirectional, metadata } = body;
  if (!source_id || !target_id || !type) {
    return NextResponse.json({ error: "source_id, target_id, type required" }, { status: 400 });
  }
  const rel = addRelationship({
    source_id,
    source_name: source_name || source_id,
    target_id,
    target_name: target_name || target_id,
    type,
    label,
    weight: weight ?? 0.5,
    bidirectional: bidirectional ?? false,
    metadata: metadata || {},
  });
  return NextResponse.json(rel, { status: 201 });
}
