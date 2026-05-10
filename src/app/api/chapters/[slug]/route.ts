import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { STORY_DIR } from "@/lib/paths";

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: content };
  const meta: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const [k, ...v] = line.split(":");
    if (k && v.length) meta[k.trim()] = v.join(":").trim();
  }
  return { meta, body: match[2] };
}

function buildFrontmatter(meta: Record<string, string>, body: string): string {
  const fm = Object.entries(meta).map(([k, v]) => `${k}: ${v}`).join("\n");
  return `---\n${fm}\n---\n${body}`;
}

type Params = { params: Promise<{ slug: string }> };

export async function GET(_: NextRequest, { params }: Params) {
  const { slug } = await params;
  const filePath = path.join(STORY_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const raw = fs.readFileSync(filePath, "utf-8");
  const { meta, body } = parseFrontmatter(raw);
  return NextResponse.json({ slug, meta, content: body });
}

export async function PUT(req: NextRequest, { params }: Params) {
  const { slug } = await params;
  const filePath = path.join(STORY_DIR, `${slug}.md`);
  const { content, title, brief } = await req.json() as { content?: string; title?: string; brief?: string };
  const raw = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf-8") : "---\n---\n";
  const { meta, body } = parseFrontmatter(raw);
  const updatedMeta = {
    ...meta,
    ...(title !== undefined && { title }),
    ...(brief !== undefined && { brief }),
    updatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(filePath, buildFrontmatter(updatedMeta, content !== undefined ? content : body));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: NextRequest, { params }: Params) {
  const { slug } = await params;
  const filePath = path.join(STORY_DIR, `${slug}.md`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return NextResponse.json({ ok: true });
}
