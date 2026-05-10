import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getAllEntities, saveEntity } from "@/lib/entities/store";
import { EntityType, ENTITY_TYPES } from "@/lib/entities/types";

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") as EntityType | null;
  if (type && !ENTITY_TYPES.includes(type)) {
    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }
  const entities = getAllEntities(type ?? undefined);
  return NextResponse.json(entities);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, name, description, metadata, tags, importance } = body;
  if (!type || !name) return NextResponse.json({ error: "type and name required" }, { status: 400 });

  const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${uuidv4().slice(0, 6)}`;
  const entity = saveEntity({
    type,
    name,
    slug,
    description: description || "",
    rich_content: "",
    metadata: metadata || {},
    tags: tags || [],
    importance: importance ?? 5,
    version: 1,
  });
  return NextResponse.json(entity, { status: 201 });
}
