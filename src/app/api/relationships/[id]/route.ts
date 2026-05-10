import { NextRequest, NextResponse } from "next/server";
import { deleteRelationship } from "@/lib/entities/store";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(_: NextRequest, { params }: Params) {
  const { id } = await params;
  deleteRelationship(id);
  return NextResponse.json({ ok: true });
}
