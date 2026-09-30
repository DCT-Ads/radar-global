import type { Locale } from "@/i18n/routing";
import { escapeHtml } from "@/lib/email/weekly-template";
import { emailLocale } from "@/lib/email/weekly-copy";
import { passwordResetUrl } from "@/lib/email/reset-password";

const COPY: Record<
  Locale,
  { subject: string; greeting: (name: string) => string; body: string; cta: string; expire: string }
> = {
  pt: {
    subject: "Radar Global · seu acesso está pronto",
    greeting: (name) => `Olá, ${name}.`,
    body: "O pagamento foi confirmado. Defina uma senha para entrar na plataforma. O link vale por 1 hora.",
    cta: "Definir senha e entrar",
    expire: "Se o link expirar, use “Esqueci a senha” na tela de entrada com este mesmo e-mail.",
  },
  en: {
    subject: "Radar Global · your access is ready",
    greeting: (name) => `Hi, ${name}.`,
    body: "Your payment is confirmed. Set a password to enter the platform. The link expires in 1 hour.",
    cta: "Set password and enter",
    expire: "If the link expires, use “Forgot password” on the login screen with this same email.",
  },
  es: {
    subject: "Radar Global · tu acceso está listo",
    greeting: (name) => `Hola, ${name}.`,
    body: "El pago está confirmado. Define una contraseña para entrar en la plataforma. El enlace vale 1 hora.",
    cta: "Definir contraseña y entrar",
    expire: "Si el enlace caduca, usa “Olvidé la contraseña” en la pantalla de acceso con este mismo correo.",
  },
};

export function renderHotmartAccessEmail(input: {
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
