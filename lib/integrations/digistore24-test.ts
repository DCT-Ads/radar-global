import { DIGISTORE24_API_URL } from "@/lib/collectors/digistore24";

export async function testDigistore24ApiKey(apiKey: string) {
  const response = await fetch(DIGISTORE24_API_URL, {
    method: "GET",
    headers: {
      "X-DS-API-KEY": apiKey,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  const text = await response.text();
  let payload: unknown = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }

  const root =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : null;
  const result =
    typeof root?.result === "string" ? root.result.toLowerCase() : null;
  const message =
    typeof root?.message === "string" ? root.message : null;

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: message ?? `Digistore24 HTTP ${response.status}`,
    };
  }

  if (result && result !== "success") {
    return {
      ok: false,
      status: response.status,
      message: message ?? `Digistore24 result=${result}`,
    };
  }

  return {
    ok: true,
    status: response.status,
    message: message ?? "ok",
  };
}
