import type { Locale } from "@/i18n/routing";
import type { NoticeDraft } from "@/lib/alerts/evaluate";

const APP_URL = "https://radar.rotadomilhao.store";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function href(locale: Locale, path: string) {
  const prefix = locale === "pt" ? "" : `/${locale}`;
  return `${APP_URL}${prefix}${path}`;
}

function shell(locale: Locale, body: string) {
  return `<!DOCTYPE html><html lang="${locale}"><body style="margin:0;background:#0B1C33;color:#F5F7FA;font-family:Georgia,serif;"><main style="max-width:640px;margin:0 auto;padding:32px 20px;">${body}<p style="margin-top:28px;font-family:sans-serif;font-size:12px;color:#8BA3B8;">Radar Global</p></main></body></html>`;
}

export function renderChangeEmail(input: {
  locale: Locale;
  name: string;
  items: NoticeDraft[];
}) {
  const items = input.items
    .map(
      (item) =>
        `<li style="margin:0 0 12px;"><a href="${escapeHtml(href(input.locale, item.href))}" style="color:#D4AF37;font-weight:700;text-decoration:none;">${escapeHtml(item.title)}</a><div style="color:#F5F7FA;font-size:14px;line-height:1.5;margin-top:4px;">${escapeHtml(item.body)}</div></li>`,
    )
    .join("");
  const copy =
    input.locale === "en"
      ? {
          subject: input.items.length === 1 ? `Radar: ${input.items[0].title} changed stage` : `Radar: ${input.items.length} watched items changed`,
          hello: `${input.name}, a watched item changed.`,
        }
      : input.locale === "es"
        ? {
            subject: input.items.length === 1 ? `Radar: ${input.items[0].title} cambió de etapa` : `Radar: ${input.items.length} monitorizados cambiaron`,
            hello: `${input.name}, un item monitorizado cambió.`,
          }
        : {
            subject: input.items.length === 1 ? `Radar: ${input.items[0].title} mudou de estágio` : `Radar: ${input.items.length} monitorados mudaram`,
            hello: `${input.name}, um item monitorado mudou.`,
          };
  const html = shell(
    input.locale,
    `<p style="margin:0 0 16px;">${escapeHtml(copy.hello)}</p><ul style="padding-left:18px;margin:0;">${items}</ul>`,
  );
  return { subject: copy.subject, html };
}

export function renderDigestEmail(input: {
  locale: Locale;
  name: string;
  items: { title: string; body: string; href: string }[];
  quiet: boolean;
}) {
  const copy =
    input.locale === "en"
      ? {
          subject: input.quiet ? "Radar: a quiet day" : `Radar: ${input.items.length} signals today`,
          hello: input.quiet
            ? `Good morning, ${input.name}. Quiet day: nothing you watch changed stage.`
            : `Good morning, ${input.name}. You have ${input.items.length} signals today:`,
        }
      : input.locale === "es"
        ? {
            subject: input.quiet ? "Radar: día calmo" : `Radar: ${input.items.length} señales hoy`,
            hello: input.quiet
              ? `Buenos días, ${input.name}. Día calmo: nada de lo que monitorizas cambió de etapa.`
              : `Buenos días, ${input.name}. Tienes ${input.items.length} señales hoy:`,
          }
        : {
            subject: input.quiet ? "Radar: dia calmo" : `Radar: ${input.items.length} sinais hoje`,
            hello: input.quiet
              ? `Bom dia, ${input.name}. Dia calmo: nenhum monitorado mudou de estágio.`
              : `Bom dia, ${input.name}. Você tem ${input.items.length} sinais hoje:`,
          };
  const list = input.quiet
    ? ""
    : `<ul style="padding-left:18px;">${input.items
        .map(
          (item) =>
            `<li style="margin:0 0 12px;"><a href="${escapeHtml(href(input.locale, item.href))}" style="color:#D4AF37;font-weight:700;text-decoration:none;">${escapeHtml(item.title)}</a><div style="font-size:14px;line-height:1.5;margin-top:4px;">${escapeHtml(item.body)}</div></li>`,
        )
        .join("")}</ul>`;
  return { subject: copy.subject, html: shell(input.locale, `<p>${escapeHtml(copy.hello)}</p>${list}`) };
}
