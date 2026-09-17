import { prisma } from "@/lib/prisma";

function isTransientDbError(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "P1001" ||
    code === "P1017" ||
    /can't reach database/i.test(message) ||
    /timed out fetching a new connection/i.test(message) ||
    /connection reset/i.test(message) ||
    /server has closed the connection/i.test(message)
  );
}

async function withRetry<T>(
  label: string,
  fn: () => Promise<T>,
  tries = 5,
  baseMs = 1_500,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastErr = error;
      if (!isTransientDbError(error) || attempt === tries) {
        throw error;
      }
      const wait = baseMs * 2 ** (attempt - 1);
      console.warn(`[${label}] tentativa ${attempt}/${tries} falhou. Retry em ${wait}ms...`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw lastErr;
}

export async function markSource(
  slug: string,
  status: "ACTIVE" | "ERROR" | "DISABLED",
  lastError: string | null,
) {
  await withRetry(`markSource:${slug}`, () =>
    prisma.source.update({
      where: { slug },
      data: {
        status,
        lastRunAt: new Date(),
        lastError,
      },
    }),
  );
}

export type HeartbeatReport = {
  lastError: string | null;
  status?: "ACTIVE" | "ERROR" | "DISABLED";
};

export async function withSourceHeartbeat<T>(
  slug: string,
  work: () => Promise<T>,
  report?: (result: T) => HeartbeatReport | string | null,
): Promise<T> {
  let lastError: string | null = null;
  let status: "ACTIVE" | "ERROR" | "DISABLED" = "ACTIVE";
  try {
    const result = await work();
    if (report) {
      const health = report(result);
      if (typeof health === "string" || health === null) {
        lastError = health;
      } else {
        lastError = health.lastError;
        status = health.status ?? (health.lastError ? "ERROR" : "ACTIVE");
      }
    }
    return result;
  } catch (error) {
    lastError = error instanceof Error ? error.message : "Collection failed";
    status = "ERROR";
    throw error;
  } finally {
    await markSource(slug, status, lastError);
  }
}
