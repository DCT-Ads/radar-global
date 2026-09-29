import type { MonitoredLaunchRow } from "@/lib/favorites/monitor";
import { emailCopy, emailLocale } from "@/lib/email/weekly-copy";

const APP_URL = "https://radar.rotadomilhao.store";

export type WeeklyBrief = {
  headline: string;
  paragraphs: string[];
  bullets: string[];
  source: "ai" | "fallback";
};

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphHtml(text: string) {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#F5F7FA;">${escapeHtml(text)}</p>`;
}

export function renderWeeklySummaryEmail(input: {
  name: string;
  locale: string;
  brief: WeeklyBrief;
  monitorados: MonitoredLaunchRow[];
}): { subject: string; html: string } {
  const copy = emailCopy(input.locale);
  const radarHref = `${APP_URL}/radar`;
  const monitorHref = `${APP_URL}/monitorados`;
  const changed = input.monitorados.filter((row) => row.changedThisWeek);

  const bullets =
    input.brief.bullets.length > 0
      ? `<ul style="margin:0 0 18px;padding-left:18px;color:#F5F7FA;font-size:15px;line-height:1.5;">${input.brief.bullets
          .map((item) => `<li style="margin-bottom:8px;">${escapeHtml(item)}</li>`)
          .join("")}</ul>`
      : "";

  const monitoradosSection =
    changed.length === 0
      ? ""
      : `
        <h2 style="margin:28px 0 12px;font-size:16px;color:#D4AF37;">${escapeHtml(copy.monitoradosTitle)}</h2>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          ${changed
            .map((row) => {
              return `<tr>
                <td style="padding:10px 0;border-bottom:1px solid #1E3A5F;">
                  <a href="${APP_URL}/launches/${escapeHtml(row.id)}" style="color:#D4AF37;font-weight:600;text-decoration:none;">${escapeHtml(row.title)}</a>
                  <div style="color:#8BA3B8;font-size:13px;margin-top:4px;">${escapeHtml(row.domain)}${row.niche ? ` · ${escapeHtml(row.niche)}` : ""} · ${escapeHtml(row.saturation ?? "—")} · ${escapeHtml(copy.confidence)} ${escapeHtml(row.confidence)}</div>
                  <div style="color:#D4AF37;font-size:12px;margin-top:4px;">${escapeHtml(copy.changedThisWeek)}</div>
                </td>
              </tr>`;
            })
            .join("")}
        </table>
        <p style="margin:12px 0 0;font-size:13px;color:#8BA3B8;">
          <a href="${monitorHref}" style="color:#00C2CB;text-decoration:none;">${escapeHtml(copy.monitoradosTitle)}</a>
        </p>
      `;

  const html = `<!DOCTYPE html>
<html lang="${escapeHtml(emailLocale(input.locale))}">
<body style="margin:0;padding:0;background:#0B1A2F;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(copy.preview)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B1A2F;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#12263F;border:1px solid #1E3A5F;border-radius:16px;padding:28px 24px;">
          <tr>
            <td>
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#D4AF37;">Radar Global</p>
              <h1 style="margin:0 0 18px;font-size:22px;line-height:1.3;color:#D4AF37;">${escapeHtml(input.brief.headline)}</h1>
              <p style="margin:0 0 16px;font-size:15px;color:#F5F7FA;">${escapeHtml(copy.greeting(input.name))}</p>
              ${input.brief.paragraphs.map(paragraphHtml).join("")}
              ${bullets}
              ${monitoradosSection}
              <p style="margin:28px 0 0;">
                <a href="${radarHref}" style="display:inline-block;background:#D4AF37;color:#0B1A2F;font-weight:700;text-decoration:none;padding:12px 18px;border-radius:8px;">${escapeHtml(copy.cta)}</a>
              </p>
              <p style="margin:28px 0 0;font-size:12px;line-height:1.5;color:#8BA3B8;">
                ${escapeHtml(copy.footer)} ${escapeHtml(copy.preferences)}
                <a href="mailto:${copy.contact}" style="color:#00C2CB;text-decoration:none;">${copy.contact}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: copy.subject, html };
}
