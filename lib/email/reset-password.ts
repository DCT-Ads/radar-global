import type { Locale } from "@/i18n/routing";
import { escapeHtml } from "@/lib/email/weekly-template";
import { emailLocale } from "@/lib/email/weekly-copy";

const APP_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://radar.rotadomilhao.store"
).replace(/\/$/, "");

const COPY: Record<
  Locale,
  { subject: string; greeting: (name: string) => string; body: string; cta: string; expire: string }
> = {
  pt: {
    subject: "Radar Global · redefinir senha",
    greeting: (name) => `Olá, ${name}.`,
    body: "Recebemos um pedido para redefinir a senha da sua conta. Se foi você, use o botão abaixo. O link vale por 1 hora.",
    cta: "Redefinir senha",
    expire: "Se você não pediu isso, ignore este e-mail. A senha atual continua valendo.",
  },
  en: {
    subject: "Radar Global · reset your password",
    greeting: (name) => `Hi, ${name}.`,
    body: "We received a request to reset your account password. If this was you, use the button below. The link expires in 1 hour.",
    cta: "Reset password",
    expire: "If you did not ask for this, ignore this email. Your current password still works.",
  },
  es: {
    subject: "Radar Global · restablecer contraseña",
    greeting: (name) => `Hola, ${name}.`,
    body: "Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú, usa el botón. El enlace vale 1 hora.",
    cta: "Restablecer contraseña",
    expire: "Si no pediste esto, ignora este correo. Tu contraseña actual sigue valiendo.",
  },
};

export function passwordResetUrl(token: string, locale: string) {
  const prefix = emailLocale(locale) === "pt" ? "" : `/${emailLocale(locale)}`;
  return `${APP_URL}${prefix}/reset-password?token=${encodeURIComponent(token)}`;
}

export function renderPasswordResetEmail(input: {
  name: string;
  locale: string;
  token: string;
}): { subject: string; html: string } {
  const copy = COPY[emailLocale(input.locale)];
  const href = passwordResetUrl(input.token, input.locale);
  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0B1A2F;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0B1A2F;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#12263F;border:1px solid #1E3A5F;border-radius:16px;padding:28px 24px;">
          <tr>
            <td>
              <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:#D4AF37;">Radar Global</p>
              <p style="margin:0 0 16px;font-size:15px;color:#F5F7FA;">${escapeHtml(copy.greeting(input.name))}</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.55;color:#F5F7FA;">${escapeHtml(copy.body)}</p>
              <p style="margin:0 0 18px;">
                <a href="${escapeHtml(href)}" style="display:inline-block;background:#D4AF37;color:#0B1A2F;font-weight:700;text-decoration:none;padding:12px 18px;border-radius:8px;">${escapeHtml(copy.cta)}</a>
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#8BA3B8;">${escapeHtml(copy.expire)}</p>
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
