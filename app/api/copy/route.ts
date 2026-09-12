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
    console.error("[copy] ANTHROPIC_API_KEY is not set");
    return NextResponse.json({ error: "ANTHROPIC_API_KEY is not set" }, { status: 503 });
  }

  try {
    const body: unknown = await req.json();
    const produto =
      body && typeof body === "object" && "produto" in body && typeof body.produto === "string"
        ? body.produto.trim()
        : "";
    const nicho =
      body && typeof body === "object" && "nicho" in body && typeof body.nicho === "string"
        ? body.nicho.trim()
        : "";
    const formato =
      body && typeof body === "object" && "formato" in body && typeof body.formato === "string"
        ? body.formato.trim()
        : "";

    if (!produto || !nicho) {
      return NextResponse.json(
        { error: "Informe o nome do produto e o nicho." },
        { status: 400 },
      );
    }

    const prompt = `Você é um copywriter especialista em vendas e marketing de afiliados no Brasil.
Crie uma copy ALTAMENTE PERSUASIVA em português brasileiro.

Produto: ${produto}
Nicho: ${nicho}
Formato: ${formato || "Anúncio de vendas"}

Estruture com:
1. HEADLINE de impacto
2. Identificação da DOR do público
3. Produto como SOLUÇÃO
4. 3 BENEFÍCIOS (bullets)
5. Prova social / quebra de objeção
6. CTA forte com urgência

Linguagem direta, emocional e voltada para conversão. Sem enrolação.`;

    const msg = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const block = msg.content[0];
    const copy = block && block.type === "text" ? block.text : "";
    return NextResponse.json({ copy });
  } catch (err) {
    const failure = anthropicFailure(err, "Falha ao gerar a copy. Verifique a API key.");
    return NextResponse.json(failure.body, { status: failure.status });
  }
}
