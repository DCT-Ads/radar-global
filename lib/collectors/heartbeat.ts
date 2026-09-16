import { prisma } from "@/lib/prisma";

export async function markSource(
  slug: string,
  status: "ACTIVE" | "ERROR" | "DISABLED",
  lastError: string | null,
) {
  await prisma.source.update({
    where: { slug },
    data: {
      status,
      lastRunAt: new Date(),
      lastError,
    },
  });
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
