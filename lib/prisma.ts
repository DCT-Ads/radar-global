import { PrismaClient } from "@prisma/client";

function withPoolSettings(url: string | undefined) {
  if (!url) {
    return url;
  }
  try {
    const parsed = new URL(url);
    const timeout = Number(parsed.searchParams.get("pool_timeout") ?? "10");
    if (!Number.isFinite(timeout) || timeout < 30) {
      parsed.searchParams.set("pool_timeout", "30");
    }
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "15");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

function isTransientDbError(error: unknown) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";
  const message = error instanceof Error ? error.message : String(error);
  return (
    code === "P1001" ||
    code === "P1017" ||
    code === "P2024" ||
    /can't reach database/i.test(message) ||
    /timed out fetching a new connection/i.test(message) ||
    /connection reset/i.test(message) ||
    /server has closed the connection/i.test(message)
  );
}

async function withRetry<T>(fn: () => Promise<T>, tries = 4, baseMs = 800): Promise<T> {
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
      console.warn(`[prisma] retry ${attempt}/${tries} em ${wait}ms`);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
  }
  throw lastErr;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createClient() {
  const client = new PrismaClient({
    datasources: {
      db: { url: withPoolSettings(process.env.DATABASE_URL) },
    },
  });
  return client.$extends({
    query: {
      $allOperations({ args, query }) {
        return withRetry(() => query(args));
      },
    },
  }) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
