import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { sampleText, apiKey } = await req.json();

  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key required" }), { status: 400 });
  }
  if (!sampleText || sampleText.trim().length < 100) {
    return new Response(JSON.stringify({ error: "Sample text must be at least 100 characters" }), { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `You are a literary analyst specializing in prose style. Analyze writing samples and extract precise, actionable voice profiles that can be used to replicate an author's style.`,
    messages: [
      {
        role: "user",
        content: `Analyze the following writing sample and extract a detailed voice profile. Return ONLY a JSON object with these exact keys:

{
  "summary": "2-3 sentence overall description of the voice",
  "sentenceRhythm": "description of sentence length patterns, pacing, and structure",
  "vocabularyStyle": "description of word choices, register, complexity, and recurring patterns",
  "dialoguePatterns": "how dialogue is written, tagged, and integrated with prose",
  "narrativeTone": "emotional register, distance, perspective tendencies",
  "distinctiveQuirks": "specific recurring techniques, unusual habits, signature moves"
}

Writing sample:
---
${sampleText}
---

Return only the JSON object, no other text.`,
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
        controller.enqueue(encoder.encode(`\n{"error":"${message}"}`));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
