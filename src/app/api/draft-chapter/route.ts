import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";
import { VoiceProfile } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { chapterBrief, voiceProfile, synopsis, previousChapters, apiKey } =
    await req.json() as {
      chapterBrief: string;
      voiceProfile: VoiceProfile;
      synopsis: string;
      previousChapters: string;
      apiKey: string;
    };

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key required" }), { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const voiceInstructions = `
VOICE PROFILE (follow this precisely):
- Overall voice: ${voiceProfile.summary}
- Sentence rhythm: ${voiceProfile.sentenceRhythm}
- Vocabulary style: ${voiceProfile.vocabularyStyle}
- Dialogue patterns: ${voiceProfile.dialoguePatterns}
- Narrative tone: ${voiceProfile.narrativeTone}
- Distinctive quirks: ${voiceProfile.distinctiveQuirks}
`.trim();

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `You are a ghostwriter who writes in the exact voice of the author, not your own. You must strictly follow the voice profile provided and produce prose that sounds indistinguishable from the author's own writing. Do not add your own stylistic flourishes. Match the author's rhythm, vocabulary, and techniques precisely.`,
    messages: [
      {
        role: "user",
        content: `Write a full chapter draft using the author's voice profile below.

${voiceInstructions}

NOVEL SYNOPSIS:
${synopsis || "No synopsis provided."}

${previousChapters ? `PREVIOUS CHAPTERS CONTEXT:\n${previousChapters}\n` : ""}

CHAPTER BRIEF:
${chapterBrief}

Write the chapter now. Output only the prose — no commentary, no headers, no explanations.`,
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
