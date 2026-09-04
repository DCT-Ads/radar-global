# RADAR GLOBAL — Scoring & MVP (Bloco B)

> Fonte de verdade do "cérebro" do sistema.
> Regra de ouro: nenhum score é inventado. Sem dado (Evidence) → sem score.

---

## FASE 6 — MOTOR DE INTELIGÊNCIA (SCORING)

### 6.0 Filosofia anti-alucinação
- Sem Evidence → sem Score exibido → UI mostra "Insufficient public data"
- Todo score carrega dataQuality (0-100) + confidence (LOW/MED/HIGH)
- Score alto + confidence baixa = mostrado com aviso ⚠️ (nunca escondido)

### 6.1 EARLY SIGNAL SCORE (detecta ANTES — o diferencial)
Fórmula: ES = 100 * (1 - e^(-Σ wi*si))

Sinais (todos de fonte pública/legal):
| Sinal                                   | Fonte             | Peso |
|-----------------------------------------|-------------------|------|
| Domínio novo (idade < 30d)              | crt.sh (CT logs)  | 0.9  |
| Múltiplos subdomínios (checkout/go/pay) | crt.sh            | 0.7  |
| SSL emitido + landing no ar             | crt.sh + HTTP     | 0.8  |
| Aparição no TikTok Creative Center      | TikTok CC         | 0.6  |
| Spike de trend do termo                 | Trends (provedor) | 0.5  |

Decaimento temporal: si(t) = si0 * e^(-λ(t - t0)), meia-vida = 7 dias.

### 6.2 HYPE SCORE (importa a velocidade, não o volume)
Hype = 100 * sigmoide( α*z(V) + β*(dV/dt) )
- V = volume normalizado (menções, ads, posts)
- z(V) = z-score contra baseline do nicho
- dV/dt = aceleração (regressão linear janela 7d)
- α = 0.6, β = 0.4

### 6.3 TREND SCORE
Trend = 100 * (slope_7d / max(slope_nicho))
- Positivo = subindo | Negativo = saturando

### 6.4 COMPETITION SCORE (quanto MENOR, melhor)
Comp = 100 * sigmoide( γ*log(1+N_ads) + δ*log(1+N_aff) )
- N_ads = anúncios ativos | N_aff = afiliados/domínios promovendo
- Log comprime saturação

### 6.5 OPPORTUNITY SCORE (o número que o afiliado olha)
Opp = 100 * [ (w1*ES + w2*Hype + w3*Trend + w4*(100-Comp) + w5*Commission) / Σw ] * (DQ/100)

Pesos MVP (ajustáveis no painel admin, NUNCA hardcoded):
| Componente             | Peso |
|------------------------|------|
| Early Signal           | 0.30 |
| Trend                  | 0.20 |
| Competition (invertido)| 0.20 |
| Hype                   | 0.15 |
| Commission             | 0.15 |

O multiplicador (DQ/100) = honestidade: dado ruim derruba a oportunidade.

### 6.6 DATA QUALITY SCORE
DQ = 100 * ( Σ rj*fj / Σ rj )
- rj = confiabilidade da fonte (crt.sh=95, marketplace=85, trend pago=80, manual=50)
- fj = frescor = e^(-λ*idade) (dado velho vale menos)

### 6.7 Pipeline de Scoring (worker BullMQ)
1. Collector grava Signal + Evidence (sourceId + timestamp)
2. Cron dispara "recompute" a cada 6h (ou on-demand em sinal forte)
3. Worker: agrega evidências → DQ → sub-scores → Opportunity
4. Grava Score novo (histórico versionado, nunca sobrescreve)
5. Verifica Alerts → notifica se cruzou threshold do usuário

---

## FASE 7 — MVP 1 (O QUE CONSTRUIR PRIMEIRO)

Regra do MVP: 1 fonte matadora + scoring honesto + 1 tela que impressiona.

### 7.1 Escopo do MVP
INCLUI ✅
- Auth (signup/login/JWT)
- Collector crt.sh (domínios novos) — fonte de ouro, grátis, legal
- Collector ClickBank/Digistore (marketplace público) — comissão
- Scoring: Early Signal + Opportunity + Data Quality
- Dashboard + Hot Launches (grid de cards)
- Página do Produto (com Evidences visíveis)
- Free vs Pro (bloqueio 🔒 de comissão)
- i18n EN padrão

FICA FORA (V2+) ❌
- Meta Ad Library, Trends pago, TikTok CC
- Alertas complexos, mapa 3D, IA conversacional
- Multiusuário, export, WhatsApp

### 7.2 Ordem de construção (sprints)
- SPRINT 0 (2-3d) — Fundação: Next.js 14 + TS + Tailwind + shadcn/ui + Prisma + Postgres + next-intl (EN) + layout dourado #D4AF37 + Auth
- SPRINT 1 (3-4d) — Coleta: worker crt.sh + HTTP probe + grava Producer/Launch/Signal/Evidence/Source
- SPRINT 2 (2-3d) — Cérebro: DQ → Early Signal → Opportunity + cron recompute + histórico versionado
- SPRINT 3 (3-4d) — Vitrine: Dashboard + Hot Launches (cards + anel dourado) + Product page + bloqueio Free/Pro
- SPRINT 4 (2-3d) — Marketplace: collector ClickBank/Digistore → Commission → Commission Radar (Pro)
- SPRINT 5 (2d) — Polish + Deploy: Landing + Pricing + Stripe + deploy Vercel/Railway

Total: ~3 semanas.

### 7.3 Stack de deploy barato (MVP)
| Camada        | Serviço             | Custo       |
|---------------|---------------------|-------------|
| Front + API   | Vercel              | Free → $20  |
| Postgres      | Neon / Supabase     | Free        |
| Redis/filas   | Upstash             | Free tier   |
| Workers/cron  | Railway             | ~$5         |
| Busca         | Meilisearch (V2)    | adiar       |
| Pagamento     | Stripe              | % por venda |

Roda por < $10/mês até ter tração.

### 7.4 Definição de "Done" do MVP
- [x] Usuário se cadastra, escolhe nicho/país
- [x] Vê Hot Launches com Opportunity Score real (de crt.sh)
- [x] Abre produto e vê as evidências (URL + fonte + data)
- [x] Comissão bloqueada no Free, liberada no Pro (Stripe OK)
- [x] Tudo em inglês, trocável de idioma
