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

export async function withSourceHeartbeat<T>(
  slug: string,
  work: () => Promise<T>,
): Promise<T> {
  let lastError: string | null = null;
  try {
    return await work();
  } catch (error) {
    lastError = error instanceof Error ? error.message : "Collection failed";
    throw error;
  } finally {
    await markSource(slug, lastError ? "ERROR" : "ACTIVE", lastError);
  }
}
