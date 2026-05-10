import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { PROJECT_FILE } from "@/lib/paths";
import { ProjectMeta } from "@/lib/types";

function read(): ProjectMeta {
  try {
    return JSON.parse(fs.readFileSync(PROJECT_FILE, "utf-8"));
  } catch {
    return { title: "My Novel", genre: "", synopsis: "", createdAt: new Date().toISOString() };
  }
}

export async function GET() {
  return NextResponse.json(read());
}

export async function PUT(req: NextRequest) {
  const body = await req.json() as Partial<ProjectMeta>;
  const current = read();
  const updated: ProjectMeta = {
    ...current,
    ...body,
    createdAt: current.createdAt || new Date().toISOString(),
  };
  fs.writeFileSync(PROJECT_FILE, JSON.stringify(updated, null, 2));
  return NextResponse.json(updated);
}
