import type { Locale } from "@/i18n/routing";

export type EmailCopy = {
  subject: string;
  preview: string;
  greeting: (name: string) => string;
  monitoradosTitle: string;
  monitoradosEmptyNote: string;
  changedThisWeek: string;
  noChange: string;
  cta: string;
  footer: string;
  preferences: string;
  contact: string;
  confidence: string;
};

const COPY: Record<Locale, EmailCopy> = {
  pt: {
    subject: "Radar Global · resumo da semana",
    preview: "Números reais da semana no Radar, e o que mudou nos seus monitorados.",
    greeting: (name) => `Olá, ${name}.`,
    monitoradosTitle: "Seus Monitorados",
    monitoradosEmptyNote: "",
    changedThisWeek: "Atualizado esta semana",
    noChange: "Sem mudanças nesta semana",
    cta: "Ver Radar completo",
    footer: "Você recebe este e-mail porque tem uma assinatura ativa do Radar Global.",
    preferences: "Para gerenciar este e-mail ou descadastrar, fale com",
    contact: "contato@radar.rotadomilhao.store",
    confidence: "Confiança",
  },
  en: {
    subject: "Radar Global · weekly briefing",
    preview: "Real Radar numbers from this week, plus what changed in your watchlist.",
    greeting: (name) => `Hi, ${name}.`,
    monitoradosTitle: "Your Watchlist",
    monitoradosEmptyNote: "",
    changedThisWeek: "Updated this week",
    noChange: "No changes this week",
    cta: "Open the full Radar",
    footer: "You get this email because you have an active Radar Global subscription.",
    preferences: "To manage or unsubscribe from this email, write to",
    contact: "contato@radar.rotadomilhao.store",
    confidence: "Confidence",
  },
  es: {
    subject: "Radar Global · resumen de la semana",
    preview: "Números reales de la semana en el Radar, y lo que cambió en tus monitorizados.",
    greeting: (name) => `Hola, ${name}.`,
    monitoradosTitle: "Tus Monitorizados",
    monitoradosEmptyNote: "",
    changedThisWeek: "Actualizado esta semana",
    noChange: "Sin cambios esta semana",
    cta: "Ver el Radar completo",
    footer: "Recibes este correo porque tienes una suscripción activa de Radar Global.",
    preferences: "Para gestionar o darte de baja de este correo, escribe a",
    contact: "contato@radar.rotadomilhao.store",
    confidence: "Confianza",
  },
};

export function emailLocale(value: string | null | undefined): Locale {
  if (value === "en" || value === "es" || value === "pt") {
    return value;
  }
  return "pt";
}

export function emailCopy(locale: string | null | undefined): EmailCopy {
  return COPY[emailLocale(locale)];
}
