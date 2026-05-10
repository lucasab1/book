import { NextRequest, NextResponse } from "next/server";
import { getProviderConfig, saveProviderConfig } from "@/lib/cli/providers";
import { checkProvider } from "@/lib/cli/adapter";

export async function GET() {
  const config = getProviderConfig();
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  saveProviderConfig(body);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  // Check if a provider CLI is available
  const { providerId } = await req.json() as { providerId: string };
  const config = getProviderConfig();
  const provider = config.providers.find((p) => p.id === providerId);
  if (!provider) return NextResponse.json({ available: false, error: "Not found" });
  const available = await checkProvider(provider);
  return NextResponse.json({ available, providerId });
}
