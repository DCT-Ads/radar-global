import { NextResponse } from "next/server";
import { requirePremiumApi } from "@/lib/auth/require-feature";
import { anthropicFailure, CLAUDE_MODEL, createAnthropicClient } from "@/lib/ai/anthropic";
import { languageForMarket, parseCopyPack, type CopyLanguage } from "@/lib/copy/pack";
import { copyPackPrompt } from "@/lib/copy/prompt";

function textField(body: unknown, key: string, max: number) {
  if (!body || typeof body !== "object" || !(key in body)) return "";
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function POST(req: Request) {
  const { user, response } = await requirePremiumApi();
  if (!user || response) return response;

  const anthropic = createAnthropicClient();
  if (!anthropic) {
    return NextResponse.json({ error: "NO_KEY" }, { status: 503 });
  }

  try {
    const body: unknown = await req.json();
    const product = textField(body, "product", 160);
    const niche = textField(body, "niche", 240);
    if (!product || !niche) {
      return NextResponse.json({ error: "MISSING" }, { status: 400 });
    }

    const locale = textField(body, "locale", 8);
    const fallback: CopyLanguage = locale === "pt" || locale === "es" ? locale : "en";
    const language = languageForMarket(textField(body, "market", 16), fallback);
    const whyRising = textField(body, "whyRising", 1500);
    const market = textField(body, "market", 16);
    const stage = textField(body, "stage", 40);
    const format = textField(body, "format", 40);

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2200,
      messages: [
        {
          role: "user",
          content: copyPackPrompt({ product, niche, whyRising, market, stage, format, language }),
        },
      ],
    });

    const block = msg.content[0];
    const raw = block && block.type === "text" ? block.text : "";
    const pack = parseCopyPack(raw, language);
    if (!pack) {
      return NextResponse.json({ error: "FAILED" }, { status: 502 });
    }
    return NextResponse.json({ pack });
  } catch (err) {
    const failure = anthropicFailure(err, "FAILED");
    return NextResponse.json({ error: "FAILED" }, { status: failure.status });
  }
}
