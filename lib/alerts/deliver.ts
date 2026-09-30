import { sendResendEmail } from "@/lib/email/resend";

export type AlertChannel = "EMAIL" | "WHATSAPP" | "BOTH" | "NONE";

export function normalizeChannel(value: string | null | undefined): AlertChannel {
  if (value === "WHATSAPP" || value === "BOTH" || value === "NONE") return value;
  return "EMAIL";
}

export async function deliverAlert(input: {
  channel: AlertChannel;
  premium: boolean;
  to: string;
  whatsappOptIn: boolean;
  subject: string;
  html: string;
}): Promise<{ email: "sent" | "skipped" | "failed"; whatsapp: "skipped" | "not_configured"; error: string | null }> {
  const channel = input.premium ? input.channel : input.channel === "NONE" ? "NONE" : "EMAIL";
  const sendEmail = channel === "EMAIL" || channel === "BOTH";
  const wantsWhatsapp = input.premium && input.whatsappOptIn && (channel === "WHATSAPP" || channel === "BOTH");

  if (!sendEmail) {
    return {
      email: "skipped",
      whatsapp: wantsWhatsapp ? "not_configured" : "skipped",
      error: null,
    };
  }

  const sent = await sendResendEmail({ to: input.to, subject: input.subject, html: input.html });
  return {
    email: sent.error ? "failed" : "sent",
    whatsapp: wantsWhatsapp ? "not_configured" : "skipped",
    error: sent.error,
  };
}
