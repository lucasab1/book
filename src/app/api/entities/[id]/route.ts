import { NextRequest, NextResponse } from "next/server";
import { getEntityById, saveEntity, deleteEntity } from "@/lib/entities/store";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const entity = getEntityById(id);
  if (!entity) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(entity);
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = getEntityById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const updated = saveEntity({ ...existing, ...body, id, version: (existing.version ?? 1) + 1 });
  return NextResponse.json(updated);
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  const existing = getEntityById(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  deleteEntity(existing.type, existing.slug);
  return NextResponse.json({ ok: true });
}
