import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { getAssets, saveAsset, deleteAsset } from "@/lib/entities/store";

const ASSETS_ROOT = path.join(process.cwd(), "assets");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export async function GET(req: NextRequest) {
  const entityId = req.nextUrl.searchParams.get("entityId");
  return NextResponse.json(getAssets(entityId ?? undefined));
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string || "reference";
  const entityId = formData.get("entityId") as string | undefined || undefined;
  const alt = formData.get("alt") as string | undefined;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const ext = path.extname(file.name) || ".bin";
  const timestamp = Date.now();
  const subdir = type;
  const filename = `${timestamp}-${file.name.replace(/[^a-z0-9._-]/gi, "_")}`;
  const storagePath = `${subdir}/${filename}`;
  const fullPath = path.join(ASSETS_ROOT, storagePath);

  ensureDir(path.dirname(fullPath));
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(fullPath, buffer);

  const asset = saveAsset({
    entity_id: entityId,
    type: type as "cover" | "portrait" | "location" | "map" | "icon" | "moodboard" | "reference" | "generated",
    filename: file.name,
    storage_path: storagePath,
    mime_type: file.type || "application/octet-stream",
    size: buffer.length,
    alt,
    tags: [],
    version: 1,
  });

  return NextResponse.json(asset, { status: 201 });
  void ext;
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteAsset(id);
  return NextResponse.json({ ok: true });
}
