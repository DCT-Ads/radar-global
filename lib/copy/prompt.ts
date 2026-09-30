import { languageLabel, type CopyLanguage } from "@/lib/copy/pack";

export function copyPackPrompt(input: {
  product: string;
  niche: string;
  whyRising: string;
  market: string;
  stage: string;
  format: string;
  language: CopyLanguage;
}) {
  return `Você escreve copy de vendas para afiliados. Responda APENAS com JSON válido, sem markdown.

Idioma de todo o texto: ${languageLabel(input.language)}.
Produto: ${input.product}
Nicho: ${input.niche}
Mercado: ${input.market || "não informado"}
Estágio: ${input.stage || "não informado"}
Formato do produto: ${input.format || "não informado"}
Por que o nicho está subindo (use isto como argumento de mercado, sem inventar número): ${input.whyRising || "não informado"}

Regras:
- Não prometa renda, faturamento, resultado garantido nem "ficar rico".
- Não invente depoimento, estatística, nota ou história de cliente.
- Sem urgência falsa de escassez.
- Tom direto.

JSON neste formato exato:
{
  "framework": "AIDA ou PAS",
  "headlines": ["gancho 1", "gancho 2", "gancho 3"],
  "body": "corpo curto no framework escolhido",
  "ctas": ["cta 1", "cta 2", "cta 3"],
  "shortCopy": "versão curta para TikTok ou Reels, até 80 palavras",
  "longCopy": "versão longa para página de vendas, com o argumento de por que o nicho está subindo"
}`;
}
