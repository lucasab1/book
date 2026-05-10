import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { STORY_DIR } from "@/lib/paths";
import { ChapterFile } from "@/lib/types";

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

export async function GET() {
  if (!fs.existsSync(STORY_DIR)) fs.mkdirSync(STORY_DIR, { recursive: true });
  const files = fs.readdirSync(STORY_DIR).filter((f) => f.endsWith(".md")).sort();
  const chapters: ChapterFile[] = files.map((f) => {
    const slug = f.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(STORY_DIR, f), "utf-8");
    const { meta, body } = parseFrontmatter(raw);
    const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;
    const draftPath = path.join(process.cwd(), "work/drafts", `${slug}.md`);
    return {
      slug,
      title: meta.title || slug,
      brief: meta.brief || "",
      order: parseInt(meta.order || "0"),
      wordCount,
      updatedAt: meta.updatedAt || new Date().toISOString(),
      hasVoiceDraft: fs.existsSync(draftPath),
    };
  });
  chapters.sort((a, b) => a.order - b.order);
  return NextResponse.json(chapters);
}

export async function POST(req: NextRequest) {
  if (!fs.existsSync(STORY_DIR)) fs.mkdirSync(STORY_DIR, { recursive: true });
  const { title, brief } = await req.json() as { title: string; brief?: string };
  const existing = fs.readdirSync(STORY_DIR).filter((f) => f.endsWith(".md"));
  const order = existing.length;
  const slug = `${String(order + 1).padStart(2, "0")}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
  const now = new Date().toISOString();
  const content = buildFrontmatter(
    { title, brief: brief || "", order: String(order), updatedAt: now },
    ""
  );
  fs.writeFileSync(path.join(STORY_DIR, `${slug}.md`), content);
  return NextResponse.json({ slug });
}
