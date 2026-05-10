import { NextRequest, NextResponse } from "next/server";
import { getThreads, saveThread, deleteThread } from "@/lib/entities/store";

export async function GET() {
  return NextResponse.json(getThreads());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const thread = saveThread(body);
  return NextResponse.json(thread, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  deleteThread(id);
  return NextResponse.json({ ok: true });
}
