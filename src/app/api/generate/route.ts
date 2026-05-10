import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getDefaultProvider, getProvider } from "@/lib/cli/providers";
import { runTask } from "@/lib/cli/adapter";
import { buildContext } from "@/lib/context/builder";
import { TaskType } from "@/lib/cli/types";
import type { SceneContext } from "@/lib/context/relevance";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    taskType: TaskType;
    providerId?: string;
    request: string;
    sceneContext?: SceneContext;
    sceneObjective?: string;
    recentChapterSlugs?: string[];
    systemPrompt?: string;
    rawPrompt?: boolean;   // skip context builder, use request as-is
  };

  const { taskType, providerId, request, sceneContext, sceneObjective, recentChapterSlugs, systemPrompt, rawPrompt } = body;

  if (!request) return NextResponse.json({ error: "request required" }, { status: 400 });

  const provider = providerId ? getProvider(providerId) : getDefaultProvider(taskType ?? "write");
  if (!provider) {
    return NextResponse.json({
      error: "No CLI provider available. Configure a provider in Settings → AI Providers.",
    }, { status: 503 });
  }

  if (!provider.enabled) {
    return NextResponse.json({ error: `Provider "${provider.name}" is disabled.` }, { status: 503 });
  }

  let finalPrompt = request;
  let finalSystem = systemPrompt || "";

  if (!rawPrompt && sceneContext) {
    const ctx = buildContext({
      sceneContext,
      sceneObjective: sceneObjective || request,
      request,
      recentChapterSlugs,
      includeVoiceProfile: taskType === "write",
      taskType,
    });
    finalSystem = ctx.systemPrompt;
    finalPrompt = ctx.userPrompt;
  }

  const taskId = uuidv4();
  const result = await runTask(provider, {
    id: taskId,
    type: taskType ?? "write",
    providerId: provider.id,
    prompt: finalPrompt,
    systemPrompt: finalSystem || undefined,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error, providerId: provider.id }, { status: 502 });
  }

  return NextResponse.json({
    taskId: result.taskId,
    content: result.content,
    provider: provider.name,
    durationMs: result.durationMs,
  });
}
