import { NextRequest, NextResponse } from "next/server";
import { getMemoryChunks, saveMemoryChunk } from "@/lib/entities/store";

export async function GET(req: NextRequest) {
  const characters = req.nextUrl.searchParams.get("characters")?.split(",").filter(Boolean);
  const tier = req.nextUrl.searchParams.get("tier") ?? undefined;
  const chunks = getMemoryChunks({ characters, tier });
  return NextResponse.json(chunks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const chunk = saveMemoryChunk(body);
  return NextResponse.json(chunk, { status: 201 });
}
