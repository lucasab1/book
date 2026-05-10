import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { KB_DIR } from "@/lib/paths";

type Params = { params: Promise<{ kbpath: string[] }> };

function safePath(parts: string[]): string {
  const rel = parts.join("/").replace(/\.\./g, "");
  return path.join(KB_DIR, rel.endsWith(".md") ? rel : `${rel}.md`);
}

export async function GET(_: NextRequest, { params }: Params) {
  const { kbpath } = await params;
  const filePath = safePath(kbpath);
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ content: fs.readFileSync(filePath, "utf-8") });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { kbpath } = await params;
  const filePath = safePath(kbpath);
  const { content } = await req.json() as { content: string };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { kbpath } = await params;
  const filePath = safePath(kbpath);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return NextResponse.json({ ok: true });
}
