# Fase 3 — Arquitetura

| Camada | Tecnologia | Por quê |
|---|---|---|
| Frontend | Next.js + TS + Tailwind + shadcn/ui | SSR, i18n nativo (global), ecossistema maduro |
| Backend | Next.js API Routes + tRPC (mono) no MVP | Menos superfície, deploy simples |
| Workers | Node + BullMQ + Redis | Filas por prioridade de fonte |
| DB | PostgreSQL (Neon) + Prisma | Já em uso |
| Busca | Postgres FTS no MVP → OpenSearch na V2 | Não pagar Elastic cedo demais |
| IA | LLM via API (RAG sobre dados reais) | Launch AI responde só com dados reais + fontes |
| i18n | next-intl | Global desde o dia 1 |
| Deploy | Vercel (front) + Railway/Fly (workers) | Workers não vivem na Vercel |

Nota de implementação: o repo está em **Next.js 16** (não downgrade para 14). tRPC ainda não está instalado.
