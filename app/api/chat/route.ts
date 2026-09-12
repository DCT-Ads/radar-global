import { NextResponse } from "next/server";
import { requirePremiumApi } from "@/lib/auth/require-feature";
import { anthropicFailure, CLAUDE_MODEL, createAnthropicClient } from "@/lib/ai/anthropic";

export async function POST(req: Request) {
  const { user, response } = await requirePremiumApi();
  if (!user || response) {
    return response;
  }

  const anthropic = createAnthropicClient();
  if (!anthropic) {
    console.error("[chat] ANTHROPIC_API_KEY is not set");
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 503 });
  }

  try {
    const body: unknown = await req.json();
    const prompt =
      body && typeof body === "object" && "prompt" in body && typeof body.prompt === "string"
        ? body.prompt.trim()
        : "";

    if (!prompt) {
      return NextResponse.json({ error: "chat_failed", message: "empty_prompt" }, { status: 400 });
    }

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt.slice(0, 8000) }],
    });

    const text = msg.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("");

    return NextResponse.json({ reply: text });
  } catch (err) {
    const failure = anthropicFailure(err, "chat_failed");
    return NextResponse.json(failure.body, { status: failure.status });
  }
}
