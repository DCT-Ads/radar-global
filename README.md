# Radar Global

SaaS de inteligência de mercado para afiliados. Monitora sinais públicos (Certificate Transparency via crt.sh + HTTP probe) e transforma em launches rastreados.

Stack: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui + Prisma/PostgreSQL + next-intl (en/pt/es).

## Pré-requisitos

- Node.js 20+
- PostgreSQL (Neon, Supabase ou local)
- Redis (opcional; só para o worker BullMQ e o cron de 6h em fila)

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha.

**Obrigatórias em produção**

| Variável | Uso |
|---|---|
| `DATABASE_URL` | Postgres |
| `JWT_SECRET` | Assinatura da sessão (`rg_session`) |
| `CRON_SECRET` | Autoriza `GET /api/cron/collect` |

**Admin (seed)**

| Variável | Uso |
|---|---|
| `ADMIN_EMAIL` | E-mail do usuário ADMIN |
| `ADMIN_PASSWORD` | Senha do ADMIN (hash com bcryptjs) |

Em desenvolvimento, se `ADMIN_EMAIL` / `ADMIN_PASSWORD` forem omitidos, o seed cria `admin@radar.local` / `ChangeMeAdmin123!`. Em produção o seed **não** cria admin sem essas variáveis.

**Opcionais**

| Variável | Uso |
|---|---|
| `REDIS_URL` | Fila BullMQ (`npm run worker`) |
| `COLLECT_KEYWORDS` | Keywords da coleta pontual (ex.: `keto`) |
| `COLLECT_MAX_DOMAINS` | Limite de domínios por run |

## Ordem de comandos

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

Este banco já tinha o schema via `db push`. A migration `init` foi gerada a partir do schema atual e marcada como aplicada (`migrate resolve --applied`) — **sem reset e sem perda de dados**. Bancos novos usam só `migrate deploy`.

Em produção (CI/host), use migrate deploy em vez de `migrate dev`:

```bash
npm install
npx prisma migrate deploy
npm run db:seed
npm run build
npm run start
```

O app sobe em `http://localhost:3000`.

## Como criar o admin

1. Defina `ADMIN_EMAIL` e `ADMIN_PASSWORD` no `.env`.
2. Rode `npm run db:seed` (idempotente: rodar 2x não duplica; promove o e-mail a `ADMIN` e garante subscription FREE).
3. Entre em `/login` e acesse `/admin`.

Sem seed de admin, o signup só cria `USER` e o painel `/admin` fica bloqueado.

## Collector

Consulta crt.sh (domínios com certificado < 30 dias), faz HTTP probe (`/`, `/checkout`, `/go`, `/pay`) e grava Producer, Launch, Signal e Evidence.

**Coleta pontual (sem Redis)**

```bash
npm run collect
```

Ou, logado como ADMIN, use **Run collector** em `/admin`.

**Worker + cron 6h (precisa de Redis)**

```bash
npm run worker
```

A rota `GET /api/cron/collect` (Vercel cron a cada 6h) também dispara a coleta. `GET /api/cron/reprobe` re-sonda só WhoisDS com `launchPending: true`. Em produção envie `Authorization: Bearer $CRON_SECRET`.
