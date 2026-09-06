# Fase 4 — UX/UI (arquitetura de telas MVP)

| Rota | Tela |
|---|---|
| `/` | Home/Hero |
| `/login` | Login (mantida) |
| `/signup` | Signup (mantida) |
| `/onboarding` | Meu Radar (país/nicho/comissão) |
| `/dashboard` | Cards + Timeline + Alertas |
| `/radar` | Caçar Oportunidades (filtros) |
| `/launches/[id]` | Página do lançamento (ciclo de vida + evidências) |
| `/producers/[id]` | Página do produtor |
| `/trends` | Trend Radar |
| `/map` | Global Launch Map |
| `/sources` | Data Sources (status) |
| `/admin` | Revisão de Signals → Verified |

Ordem de construção: migrations → coletor crt.sh grava Signal → fila de revisão no `/admin` → só então telas de vitrine (`/radar`, `/trends`, `/map`, `/launches`, `/producers`, `/onboarding`).
