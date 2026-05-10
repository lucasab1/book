import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { VoiceProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { chapterContent, voiceProfile, synopsis, chapterBrief, apiKey } =
    await req.json() as {
      chapterContent: string;
      voiceProfile: VoiceProfile | null;
      synopsis: string;
      chapterBrief: string;
      apiKey: string;
    };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key required" }), { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are a sharp, honest developmental editor. You give concise, actionable craft notes — structural, tonal, and voice-level feedback. You do not flatter. You identify what's working and what needs attention.`,
    messages: [
      {
        role: "user",
        content: `Read this chapter and give editorial notes.

${synopsis ? `NOVEL SYNOPSIS:\n${synopsis}\n` : ""}
${chapterBrief ? `CHAPTER INTENT:\n${chapterBrief}\n` : ""}
${voiceProfile ? `AUTHOR'S VOICE PROFILE:\n${voiceProfile.summary}\nDistinctive quirks: ${voiceProfile.distinctiveQuirks}\n` : ""}

CHAPTER:
---
${chapterContent}
---

Provide structured editorial notes covering:
1. **Structure & Pacing** — what's working, what drags or rushes
2. **Voice Consistency** — does it match the author's profile?
3. **Scene & Character** — are the beats landing?
4. **Specific Fixes** — 2-3 concrete, line-level suggestions

Be direct. Under 400 words.`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Stream error";
        controller.enqueue(encoder.encode(`\n\n[Error: ${message}]`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
