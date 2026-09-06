# Fase 6 — Inteligência / Scoring (VIGENTE)

Fonte de verdade do cérebro. Não implementar o motor até existir Signal `VERIFIED` com Evidence.

## Regras

- Cada score é 0–100.
- `confidence` é **separado** do score (0–100).
- Fórmulas ponderadas e explicáveis. Só dados reais.
- Sem Evidence → sem score → UI mostra **"Não encontrado em fontes públicas"** / confiança baixa.
- Worker de scoring: **lê apenas Evidence**. Nunca infere dado ausente. Nunca inventa.
- Ausência de sinal **não entra na soma** (não vira zero inventado).
- Pesos `wi` vêm de config admin, nunca hardcoded.

## Early Signal (média ponderada)

```
EarlySignal = 100 × (Σ wi · si) / (Σ wi)
```

`si` ∈ [0, 1] só entra se o sinal foi observado em Evidence.

## Opportunity

Normalizado de:

```
demanda × novidade × (1 / competição) × tempo
```

Qualquer input faltando → Opportunity não sobe; confiança cai.

## Demais scores

| Score | Sinais principais (só dados reais) | Baixa confiança se… |
|---|---|---|
| Early Signal | domínio novo, página “em breve”, lista de espera, idade do domínio (RDAP) | poucos sinais |
| Hype | crescimento de menções/vídeos YouTube, velocidade | 1 fonte só |
| Trend | direção da curva de buscas/RSS | dados esparsos |
| Competition | nº de páginas/afiliados detectados | estimativa fraca |
| Opportunity | demanda × novidade × (1/competição) × tempo | qualquer input faltando |
| DataQuality | completude + nº de evidências + recência | — |

## Histórico

A fórmula exponencial `100 × (1 − e^(−Σ wi·si))` está **DEPRECATED** em `docs/04-scoring-mvp.md`. Não usar na Sprint 2.
