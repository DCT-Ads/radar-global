# Fase 7 — MVP (o que se constrói primeiro)

MVP 1 = fundação real. Ordem: coletor crt.sh → revisão no `/admin` → Signals `VERIFIED` → só então scoring (EarlySignal + DataQuality) e vitrine.

## Inclui

| Item | Estado |
|---|---|
| Coletor crt.sh | Feito (grava Signal, não Producer/Launch) |
| Coletor RDAP | Não |
| Coletor RSS | Não |
| YouTube API | Feito — `videos.list?chart=mostPopular&regionCode=BR` + keyword no parser + heartbeat |
| Crawl leve (robots-aware) | Não (HTTP probe existe no worker, sem respeito a robots.txt documentado) |
| Pipeline Signal → Candidate → Verified | Parcial: NEW → VERIFIED/DISCARDED no admin; ENRICHING/CANDIDATE ainda sem fluxo automático |
| Admin de revisão de sinais | Feito (`/admin` fila + Coletores) |
| Producer/Launch com Evidências | Feito no Verificar |
| Scores: EarlySignal + DataQuality | Motor lê só Evidence; pesos em `lib/scoring/admin-weights.ts`; Score insert-only |
| Dashboard + Radar + páginas Launch/Producer | `/radar` lista VERIFIED por janela de ouro; `/launches/[id]` e `/producers/[id]` com evidência real |
| Auth + planos Free/Pro + paywall | Auth e Planos no schema/seed; paywall Stripe **não** |
| i18n global (BR/LATAM/Gringa) | `en` / `pt` / `es` ligados |

## Backlog (não-bloqueante)

- Digistore24: fallback `domain = "digistore24.com"` quando a entry não tem sales page. Documentar no Radar o que acontece se várias entries caírem no domínio genérico (verify/producer podem colidir).
- Digistore24 `keywordVolume`: idêntico ao `persist-nrd` — `(market.byKeyword[keyword] ?? 0) + (existing ? 0 : 1)`.

## Marketplace (7) — só API oficial de catálogo

Não scrapear. Sem endpoint verificável de discovery → pula.

| Fonte | Veredito | Motivo |
|---|---|---|
| Digistore24 | Implementado | `GET/POST /api/call/listMarketplaceEntries` + header `X-DS-API-KEY` |
| ClickBank | Pula | Marketplace Feed morto (mar/2022). Products API = conta do seller |
| JVZoo | Pula | API de transações/afiliados da conta, sem list de catálogo |
| WarriorPlus | Pula | V2 `GET /api/v2/offers` é **vendor account**, não marketplace. V1 só `sale/{id}` |
| BuyGoods | Pula | IPN/postback de pedido. “API / XML Feed” na landing sem spec/URL oficial |
| MunchEye | Pula | Calendário WordPress; sem API. Scraper de terceiro não conta |
| MaxWeb | Pula | Catálogo no backoffice após aprovação; integração = postback, sem list oficial |
| Hotmart | Pula | `GET /products/api/v1/products` é **lista do criador**. OAuth da conta. Sem catalog de marketplace |
| Kiwify | Pula | `GET /v1/products` + `x-kiwify-account-id` = produtos **da conta**. Affiliates = seus afiliados |

## Discovery aberto (oficial) — veredito auth/endpoint

Confirmado nos docs oficiais. Sem scraper.

| Fonte | Estado | Auth + endpoint | Notas |
|---|---|---|---|
| YouTube Data API v3 | **Feito** | `YOUTUBE_API_KEY`. `GET /youtube/v3/videos?part=snippet&chart=mostPopular&regionCode=BR`. Keyword no parser (não `search.list`). Heartbeat via `withSourceHeartbeat`. | Provas: mock + key ausente + negativa. |
| Reddit Listings | Mapeado — próxima rodada | OAuth2 Application Only + `GET oauth.reddit.com/r/{sub}/hot` e `/top` | Sem coletor ainda. |
| Product Hunt API v2 | **Bloqueado** | GraphQL `posts` existe | TOS comercial: *must not be used for commercial purposes* até autorização escrita de hello@producthunt.com. Sem coletor. |
| Google Trends API | V2 | Alpha por convite | Aguardando saída do alpha. Não scrapear. |
| Kiwify | Pula | `GET /v1/products` + `x-kiwify-account-id` | Escopo de conta. |

## V2 (fora do MVP)

- Google Trends API — **aguardando saída do alpha** (application-gated). Sem consumo real hoje. Não scrapear.
- Meta Ad Library
- Hotmart / Kiwify (via afiliação) — pesquisados: API só escopo de conta, sem discovery de catálogo
- OpenSearch
- Extensão Chrome
- Launch AI avançada
- Mapa completo
