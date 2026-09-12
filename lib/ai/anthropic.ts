import Anthropic from "@anthropic-ai/sdk";

export const CLAUDE_MODEL = "claude-sonnet-5";

export function getAnthropicApiKey() {
  const key = process.env.ANTHROPIC_API_KEY?.trim();
  return key || null;
}

export function createAnthropicClient() {
  const apiKey = getAnthropicApiKey();
  if (!apiKey) {
    return null;
  }
  return new Anthropic({ apiKey });
}

export function anthropicFailure(err: unknown, fallback: string) {
  const status =
    err && typeof err === "object" && "status" in err && typeof err.status === "number"
      ? err.status
      : undefined;
  const message = err instanceof Error ? err.message : fallback;
  console.error("[anthropic]", { status, message, err });
  const http = status === 429 ? 429 : status === 401 || status === 403 ? 502 : 500;
  return {
    status: http,
    body: {
      error: fallback,
      providerStatus: status ?? null,
      message,
    },
  };
}
