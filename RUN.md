# Radar Global — como manter a coleta ligada

O `npm run dev` **só serve a UI**. Sem o worker (ou um `collect` manual), o banco não ganha sinal novo.

## Dois terminais (uso diário)

**Terminal 1 — UI**

```bash
npm run dev
```

Abre `http://localhost:3000`. Dashboard e `/admin` leem o Neon do `.env`.

**Terminal 2 — coleta contínua (a cada 6h)**

```bash
npm run worker
```

Sobe o BullMQ no Redis. Agenda:

- collect (WhoisDS + Digistore24 + YouTube + crt.sh + HTTP probe) a cada 6h
- re-probe NRD (landing ainda fora do ar) a cada 6h

O worker **não** roda MunchEye. Esse é o comando separado abaixo.

Deixe o terminal 2 aberto. Se fechar, a fila para.

## Coleta manual (na hora)

No diretório do projeto, **sem** depender do worker:

```bash
npm run collect
```

Uma rodada inline: WhoisDS, Digistore24, YouTube, crt.sh. O JSON no terminal traz `nrdDiscovered`, `digistore24Discovered`, `youtubeDiscovered`, `discovered` (crt.sh) e `errors`.

```bash
npm run collect:muncheye
```

Uma rodada MunchEye (lento: várias páginas + artigo de cada item). Só persiste domínio real de produto, não `muncheye.com`.

Pelo admin: **Admin → Coletores → Rodar agora**. Com Redis no ar isso **enfileira**; o job só corre se o terminal 2 (`npm run worker`) estiver ligado. Para ver o resultado na hora, use `npm run collect`.

## Digistore24 — onde colar a chave

O collect **não** usa a linha do `.env` na hora de chamar a API. Ele lê a chave salva no banco.

1. Login ADMIN.
2. **Admin → Integrações** (`/admin/integracoes`).
3. Aba **Digistore24** (já abre nela).
4. Campo **API Key** → colar a chave → **Salvar**.
5. Confirmação: toast **“Integração salva.”** e o badge muda para **Conectado**. Deve aparecer um hint mascarado (`…xxxx`).
6. Opcional: **Validar** — badge **Validada** se a API responder.

Depois: `npm run collect` de novo. Se a chave estiver ok, `errors` não terá `DIGISTORE24_API_KEY is missing`. `digistore24Discovered: 0` sem erro = API ok, nenhum anúncio bateu nas keywords da rodada (`keto`, `weightloss`, `skincare`, `cbd`).

## Enrichment / score

Já roda **dentro** do persist (`confidence`, `countryHint`, `langHint`). WhoisDS grava `enrichedAt` **depois** do HTTP probe. MunchEye sem keyword fica incompleto (confidence 0). Evidence e score de Launch só depois do probe promover a **VERIFIED**.

Backfill (sinais que já estão no banco, se algum ficou sem confidence):

```bash
npm run signals:enrich
```

Não substitui o collect. Não use se a tabela estiver vazia.

## Correções da fila Admin (set 2026)

1. **Fonte** — `/admin` filtra por coletor e intercala WhoisDS/crt.sh/Digistore24/YouTube/MunchEye. MunchEye não ocupa sozinho os 100 primeiros. Paginação real.
2. **Confiança** — sem keyword/probe o Admin mostra **Incompleto** (não o 62 clonado). MunchEye novo grava `confidence = 0` até haver enrich de verdade.
3. **Saturação** — keyword vazia = **Desconhecido**, nunca Hot. Idade do domínio e nº de concorrentes entram no cálculo.
4. **Worker** — collect **não** re-probeia NRD com `enrichedAt`. Reprobe só `launchPending`. Ao subir, o worker limpa jobs manuais enfileirados (não dispara o backlog). Cron continua 6h.

## O que não fazer

- Não rode `npx prisma migrate dev`, `db push` nem `db:seed` para “encher” o dashboard.
- Não apague o terminal do worker achando que o `dev` coleta sozinho.
- Cron da Vercel (1×/dia: collect / reprobe / muncheye) só funciona no deploy, com o **mesmo** `DATABASE_URL` deste Neon e `CRON_SECRET` nas env da Vercel.
