const RESEND_URL = "https://api.resend.com/emails";

export function getResendApiKey() {
  return process.env.RESEND_API_KEY?.trim() || null;
}

export function getEmailFrom() {
  return (
    process.env.EMAIL_FROM?.trim() ||
    "Radar Global <contato@radar.rotadomilhao.store>"
  );
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ id: string | null; error: string | null }> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return { id: null, error: "RESEND_API_KEY is not set" };
  }

  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getEmailFrom(),
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data && typeof data === "object" && "message" in data && typeof data.message === "string"
        ? data.message
        : `resend_${res.status}`;
    return { id: null, error: message };
  }

  const id =
    data && typeof data === "object" && "id" in data && typeof data.id === "string"
      ? data.id
      : null;
  return { id, error: null };
}
