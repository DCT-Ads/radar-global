import { testDigistore24ApiKey } from "@/lib/integrations/digistore24-test";
import type { IntegrationCreds } from "@/lib/integrations/store";
import type { PlatformId } from "@/lib/integrations/platforms";

export type ValidateResult = {
  ok: boolean;
  error?: "INVALID" | "UPSTREAM" | "LIVE_UNAVAILABLE";
};

const TIMEOUT_MS = 15_000;

async function readJson(response: Response) {
  const text = await response.text();
  try {
    return text && text.trim() ? (JSON.parse(text) as unknown) : null;
  } catch {
    return null;
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

async function validateDigistore24(creds: IntegrationCreds): Promise<ValidateResult> {
  const apiKey = creds.apiKey?.trim();
  if (!apiKey) {
    return { ok: false, error: "INVALID" };
  }
  const result = await testDigistore24ApiKey(apiKey);
  return result.ok ? { ok: true } : { ok: false, error: "INVALID" };
}

async function validateHotmart(creds: IntegrationCreds): Promise<ValidateResult> {
  const clientId = creds.clientId?.trim();
  const clientSecret = creds.clientSecret?.trim();
  if (!clientId || !clientSecret) {
    return { ok: false, error: "INVALID" };
  }
  const basic =
    creds.basicToken?.replace(/^Basic\s+/i, "").trim() ||
    Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const url = new URL("https://api-sec-vlc.hotmart.com/security/oauth/token");
  url.searchParams.set("grant_type", "client_credentials");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("client_secret", clientSecret);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: "INVALID" };
    }
    const payload = asRecord(await readJson(response));
    const token = typeof payload?.access_token === "string" ? payload.access_token : "";
    return token ? { ok: true } : { ok: false, error: "UPSTREAM" };
  } catch {
    return { ok: false, error: "UPSTREAM" };
  }
}

async function validateMonetizze(creds: IntegrationCreds): Promise<ValidateResult> {
  const consumerKey = creds.apiKey?.trim();
  if (!consumerKey) {
    return { ok: false, error: "INVALID" };
  }
  try {
    const response = await fetch("https://api.monetizze.com.br/2.1/produto/listar", {
      headers: { "x-consumer-authentication-token": consumerKey },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: "INVALID" };
    }
    return response.ok ? { ok: true } : { ok: false, error: "UPSTREAM" };
  } catch {
    return { ok: false, error: "UPSTREAM" };
  }
}

async function validateKiwify(creds: IntegrationCreds): Promise<ValidateResult> {
  const clientId = creds.clientId?.trim();
  const clientSecret = creds.clientSecret?.trim();
  if (!clientId || !clientSecret) {
    return { ok: false, error: "INVALID" };
  }
  try {
    const response = await fetch("https://public-api.kiwify.com/v1/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: "INVALID" };
    }
    const data = asRecord(await readJson(response));
    return typeof data?.access_token === "string" && data.access_token
      ? { ok: true }
      : { ok: false, error: "UPSTREAM" };
  } catch {
    return { ok: false, error: "UPSTREAM" };
  }
}

async function validateEduzz(creds: IntegrationCreds): Promise<ValidateResult> {
  const publicKey = creds.publicKey?.trim() || creds.clientId?.trim();
  const apiKey = creds.apiKey?.trim();
  if (!publicKey || !apiKey) {
    return { ok: false, error: "INVALID" };
  }
  try {
    const response = await fetch("https://api.eduzz.com/credential/generate_token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publickey: publicKey, apikey: apiKey }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: "INVALID" };
    }
    const data = asRecord(await readJson(response));
    const token = asRecord(data?.data)?.token;
    return typeof token === "string" && token
      ? { ok: true }
      : { ok: false, error: "UPSTREAM" };
  } catch {
    return { ok: false, error: "UPSTREAM" };
  }
}

async function validateClickBank(creds: IntegrationCreds): Promise<ValidateResult> {
  const devKey = creds.devApiKey?.trim() || creds.clientId?.trim();
  const clerkKey = creds.clerkApiKey?.trim() || creds.apiKey?.trim();
  if (!devKey || !clerkKey) {
    return { ok: false, error: "INVALID" };
  }
  try {
    const response = await fetch("https://api.clickbank.com/rest/1.3/orders/list", {
      headers: {
        Authorization: `${devKey}:${clerkKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.status === 401 || response.status === 403) {
      return { ok: false, error: "INVALID" };
    }
    return response.ok || response.status === 400
      ? { ok: true }
      : { ok: false, error: "UPSTREAM" };
  } catch {
    return { ok: false, error: "UPSTREAM" };
  }
}

async function validateNoLive(creds: IntegrationCreds): Promise<ValidateResult> {
  const hasAny = Object.values(creds).some((value) => value?.trim());
  return hasAny
    ? { ok: true, error: "LIVE_UNAVAILABLE" }
    : { ok: false, error: "INVALID" };
}

const validators: Record<
  PlatformId,
  (creds: IntegrationCreds) => Promise<ValidateResult>
> = {
  digistore24: validateDigistore24,
  hotmart: validateHotmart,
  monetizze: validateMonetizze,
  kiwify: validateKiwify,
  eduzz: validateEduzz,
  clickbank: validateClickBank,
  braip: validateNoLive,
  baygood: validateNoLive,
};

export async function validatePlatform(
  platform: PlatformId,
  creds: IntegrationCreds,
): Promise<ValidateResult> {
  return validators[platform](creds);
}
