# PROJETO: RADAR GLOBAL — SaaS de Inteligência de Mercado para Afiliados

> ⚠️ **OBSOLETO como prompt vigente.** Use `docs/12-fase-8-master-prompt.md`.
> Este arquivo é histórico (Sprint 0 original, Next 14, tema ouro).

Você é um engenheiro sênior full-stack. Vamos construir um SaaS do zero, numa pasta vazia. Trabalhe SPRINT POR SPRINT — não gere tudo de uma vez. Ao fim de cada sprint, pare e me peça para revisar.

## VISÃO DO PRODUTO
"Discover the next big launch before the market does."
Monitora sinais PÚBLICOS e LEGAIS (novos domínios via Certificate Transparency, marketplaces públicos) e transforma em oportunidades ranqueadas para afiliados. Foco: mercado gringa (USD), com i18n.

## REGRA DE OURO (INEGOCIÁVEL)
Nenhuma informação é exibida como fato sem uma Evidence (URL + fonte + data). Sem dado → UI mostra "Insufficient public data". Nunca invente dados. Nunca faça scraping de fontes que proíbam nos termos.

## STACK OBRIGATÓRIA
- Frontend: Next.js 14 (App Router) + TypeScript + Tailwind + shadcn/ui
- i18n: next-intl (inglês padrão, trocável por usuário)
- Backend: API routes / tRPC + Zod validation
- ORM: Prisma + PostgreSQL
- Filas/workers: BullMQ + Redis (Upstash)
- Auth: JWT (signup/login) + RBAC (USER/ADMIN)
- Cor principal: Dourado #D4AF37 (Gold Premium), tema dark premium
- Deploy alvo: Vercel (front) + Railway (workers)

## MODELO DE DADOS (Prisma)
Models: User, Producer, Launch, Score, Evidence, Source, Signal, Commission, Alert, Favorite, Country, Subscription, Plan, AuditLog, Search.
- Score guarda: hype, opportunity, trend, competition, earlySignal, dataQuality, confidence — histórico versionado (nunca sobrescreve).
- Evidence é obrigatória para exibir qualquer dado de Launch.
- Enums: Role, Lifecycle(DISCOVERY→...→DECLINING), Confidence(LOW/MED/HIGH), SourceStatus.

## SCORING (implementar na Sprint 2)

> Metodologia vigente: `docs/10-fase-6-scoring.md` (média ponderada). As linhas abaixo são históricas.

- EARLY SIGNAL: ES = 100*(1 - e^(-Σwi*si)), com decaimento e^(-λt), meia-vida 7d
- OPPORTUNITY: média ponderada [ES 0.30, Trend 0.20, (100-Comp) 0.20, Hype 0.15, Commission 0.15] * (DQ/100)
- DATA QUALITY: DQ = Σ(rj*fj)/Σrj, rj=confiabilidade da fonte, fj=frescor e^(-λ*idade)
- Pesos NUNCA hardcoded — ler de config editável no admin.

## FONTES DE DADOS (MVP)
1. crt.sh (Certificate Transparency) — domínios novos. LEGAL e público. Fonte principal.
2. HTTP probe — landing está no ar? tem /checkout /go /pay?
3. ClickBank/Digistore marketplace público — comissões (Sprint 4).

## PLANOS
FREE ($0): 3 oportunidades/dia, comissão bloqueada 🔒, 1 país
PRO ($47): comissões, 3 países, alertas, histórico 30d
PREMIUM ($97): tudo + Early Signal + alertas ilimitados
Stripe para pagamento.

---

## SPRINTS (execute UM por vez, pare ao fim de cada)

### SPRINT 0 — FUNDAÇÃO
Inicialize Next.js 14 + TS + Tailwind + shadcn/ui. Configure next-intl (en/pt/es, padrão en). Configure Prisma + Postgres com TODOS os models acima. Tema dark com dourado #D4AF37. Auth JWT (signup/login) + middleware RBAC. Layout base (sidebar + topbar). Seed de Countries.

### SPRINT 1 — COLETA
Worker BullMQ que consulta crt.sh por keywords de nicho, detecta domínios com idade < 30d, faz HTTP probe (landing + checkout). Grava Producer, Launch, Signal, Evidence, Source. Cron a cada 6h. Painel admin mostrando status das Sources.

### SPRINT 2 — CÉREBRO (SCORING)
Implemente as fórmulas de scoring acima como serviço puro e testável. Worker recompute: agrega Evidence → DQ → sub-scores → Opportunity. Grava Score versionado. Testes unitários das fórmulas.

### SPRINT 3 — VITRINE
Dashboard (métricas + top opportunities). Hot Launches (grid de cards com anel de score dourado). Página do Produto: lifecycle timeline + scores + lista de Evidences (URL+fonte+data). Bloqueio 🔒 Free vs Pro. Estado vazio elegante ("Insufficient public data").

### SPRINT 4 — MARKETPLACE
Collector ClickBank/Digistore público → grava Commission. Commission Radar (tela Pro). Integra Commission no Opportunity Score.

### SPRINT 5 — POLISH + DEPLOY
Landing page (hero dourado + CTA "Explore the Radar"). Pricing. Onboarding (nicho/país/comissão mín). Stripe (Free/Pro/Premium). Deploy Vercel + Railway. README com env vars.

---

## PADRÕES DE QUALIDADE
- TypeScript estrito, sem `any`.
- Componentes shadcn/ui reutilizáveis.
- Validação Zod em toda entrada.
- Comentários só onde a lógica é não-óbvia (ex: fórmulas de score).
- Commits semânticos por feature.

COMECE PELA SPRINT 0. Mostre a estrutura de pastas proposta e o schema.prisma completo, e pare para minha aprovação antes de gerar o resto.
