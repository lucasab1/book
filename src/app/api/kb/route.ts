import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { KB_DIR } from "@/lib/paths";
import { KbEntry } from "@/lib/types";

const CATEGORIES = ["characters", "world", "style", "continuity"] as const;

function walkDir(dir: string, base: string): KbEntry[] {
  if (!fs.existsSync(dir)) return [];
  const entries: KbEntry[] = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const rel = path.join(base, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      entries.push(...walkDir(full, rel));
    } else if (item.endsWith(".md")) {
      const category = CATEGORIES.find((c) => rel.startsWith(c)) ?? "other";
      entries.push({
        path: rel,
        name: item.replace(/\.md$/, ""),
        category,
        updatedAt: stat.mtime.toISOString(),
      });
    }
  }
  return entries;
}

export async function GET() {
  if (!fs.existsSync(KB_DIR)) fs.mkdirSync(KB_DIR, { recursive: true });
  const entries = walkDir(KB_DIR, "");
  return NextResponse.json(entries);
}
