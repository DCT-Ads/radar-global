# Fase 8 — Master prompt final (VIGENTE)

Prompt para construir o sistema. Já embute as decisões reais: fontes legais, signal-first, global.

## Estado deste repo (não recomeçar do zero)

- Fundação + coletor crt.sh + fila `/admin` (Signal → Verified) já existem.
- Stack real: **Next.js 16** (não downgrade para 14), React 19, Tailwind 4, Prisma + Neon.
- Tema vigente: dark + ouro `#D4AF37` (`--gold`). Não usar o roxo do rascunho abaixo.
- `LaunchStatus` vigente: `DISCOVERY → EARLY_SIGNAL → PRE_LAUNCH → LAUNCH_IMMINENT → LAUNCHED → GROWING → SATURATED → DECLINING`.
- Company, State/City, Category/Subcategory, Organization, Notification, SavedSearch: ver `docs/09-schema-roadmap.md`. Não criar agora.
- Scoring vigente: `docs/10-fase-6-scoring.md`. Motor ainda não.
- Empty state canônico: **"Não encontrado em fontes públicas"**. UI padrão em PT-BR (`defaultLocale: pt`).

---

Você é um time sênior (arquiteto, PM, eng. de dados, UX, segurança)
construindo um SaaS PREMIUM de inteligência de lançamentos para afiliados.

OBJETIVO: descobrir produtos, produtores e lançamentos ANTES da
saturação, usando SOMENTE dados públicos e APIs oficiais. NUNCA
inventar dados, contatos, comissões ou datas. Sem info não encontrada,
exibir "Não encontrado em fontes públicas".

MERCADO: GLOBAL desde o dia 1 (Brasil, LATAM, Gringa). i18n com
next-intl. Nenhum país hardcoded — tudo via tabelas Country/State/City.

STACK:
- Next.js 14 + TypeScript + Tailwind + shadcn/ui (dark cyber premium:
  fundo #0D0E12, primária #7C3AED, verde/amarelo/vermelho p/ indicadores)
- tRPC, Prisma, PostgreSQL (Neon)
- Workers: Node + BullMQ + Redis (filas por prioridade de fonte)
- Busca: Postgres FTS no MVP
- Deploy: Vercel (app) + Railway/Fly (workers)

ARQUITETURA DE DADOS (signal-first):
Fontes → Signal (cru) → enriquecimento → Candidate → verificação com
evidência → Producer + Launch (reais). Producer/Launch SEMPRE têm ≥1
Evidence (fonte, url, coletaAt, tipo, confiança).
Model Signal: type(enum NEW_DOMAIN,NEW_SUBDOMAIN,RSS_ITEM,YOUTUBE_VIDEO,
LANDING_PAGE,WHOIS_CHANGE), source, value, rawData(Json), domain?, url?,
keyword?, niche?, countryHint?, langHint?, confidence(0-100),
status(NEW,ENRICHING,CANDIDATE,VERIFIED,DISCARDED), producerId?,
launchId?, discoveredAt, verifiedAt, timestamps, @@unique([source,value]).
Demais entidades: Producer, Launch, Company, Country/State/City,
Category/Subcategory, Source, Evidence, Score, User/Organization/Plan/
Subscription, Alert/Notification/Favorite/SavedSearch, AuditLog.

FONTES REAIS (MVP — só estas, todas legais e respeitando robots.txt/ToS):
1. crt.sh (Certificate Transparency) — domínios novos
2. RDAP/WHOIS — idade e dados públicos de domínio
3. RSS/feeds/newsletters públicas — itens de lançamento
4. YouTube Data API v3 — vídeos/menções (respeitar quota)
5. Crawl leve de landing pages (robots-aware) — sinais "em breve",
   listas de espera, páginas de captura
NÃO implementar Meta Ad Library nem Hotmart/Kiwify no MVP (sem API
pública de catálogo). Deixar interface de conector pronta p/ V2 via
afiliação/parceria autorizada.

SCORING (0-100, transparente, com confidence separado):
EarlySignal, Hype, Trend, Competition, Opportunity, DataQuality.
Fórmula ponderada explicável. Pouco dado = confiança baixa, score não
infla. Cada score guarda os sinais que o justificam.

CICLO DE VIDA DO LAUNCH: DISCOVERY → EARLY_SIGNAL → PRE_LAUNCH →
LAUNCH_IMMINENT → LAUNCHED → GROWING → SATURATED → DECLINING.

DATAS/FUSO: armazenar UTC, exibir no fuso do usuário + countdown.

FUNCIONALIDADES MVP: Dashboard (cards+timeline+alertas), Caçar
Oportunidades (filtros país/nicho/comissão/hype/competição), páginas
de Launch e Producer com Evidências, Trend Radar, Global Launch Map,
Data Sources (status), Meu Radar (personalização), Favoritos, Busca
global (FTS, tolerante a erro), Admin (revisar Signal→Verified).

IA "Launch AI": RAG APENAS sobre dados do próprio banco; sempre cita
fontes; se não houver dado, responde "Informação não encontrada".
Zero alucinação.

MONETIZAÇÃO: Free (visão limitada + paywall em produtor/contato/
comissão/evidências), Pro, Premium, Enterprise (API/multiusuário).
Sem dark patterns.

SEGURANÇA: Auth + RBAC, rate limiting, secrets management, criptografia,
audit logs, secure headers, OWASP, dependency scanning. Segurança
defensiva do PRÓPRIO sistema apenas.

ENTREGA: comece pela FUNDAÇÃO (Prisma schema + Signal pipeline +
1 coletor: crt.sh), depois workers das demais fontes, depois UI.
Código real, funcional, pronto p/ produção. Testes unit/integration/e2e.
Se algo for impossível/ilegal, diga claramente e proponha alternativa
legítima. NÃO invente APIs.
