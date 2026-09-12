import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ensureSources, SOURCE_SLUGS } from "@/lib/sources";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/integrations/secret";

export type Digistore24StoredConfig = {
  apiKeyEnc?: string;
  nickname?: string | null;
};

function asConfig(value: unknown): Digistore24StoredConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const record = value as Record<string, unknown>;
  return {
    apiKeyEnc: typeof record.apiKeyEnc === "string" ? record.apiKeyEnc : undefined,
    nickname: typeof record.nickname === "string" ? record.nickname : null,
  };
}

export async function getDigistore24ApiKey() {
  const { getDecryptedCreds } = await import("@/lib/integrations/store");
  const stored = await getDecryptedCreds("digistore24");
  if (stored.apiKey?.trim()) {
    return stored.apiKey.trim();
  }
  return null;
}

export async function getDigistore24PublicConfig() {
  await ensureSources();
  const source = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.digistore24 },
    select: { config: true, status: true, lastError: true },
  });
  const stored = asConfig(source?.config);
  const envKey = process.env.DIGISTORE24_API_KEY?.trim() || null;
  let dbKey: string | null = null;
  if (stored.apiKeyEnc) {
    try {
      dbKey = decryptSecret(stored.apiKeyEnc);
    } catch {
      dbKey = null;
    }
  }
  const activeKey = envKey ?? dbKey;
  return {
    nickname: stored.nickname ?? "",
    hasKey: Boolean(activeKey),
    keyHint: activeKey ? maskSecret(activeKey) : null,
    fromEnv: Boolean(envKey),
    connected: Boolean(activeKey),
    sourceStatus: source?.status ?? "ACTIVE",
    lastError: source?.lastError ?? null,
  };
}

export async function saveDigistore24Config(input: {
  apiKey?: string;
  nickname?: string;
}) {
  await ensureSources();
  const source = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.digistore24 },
    select: { config: true },
  });
  const current = asConfig(source?.config);
  const next: Digistore24StoredConfig = {
    ...current,
    nickname: input.nickname?.trim() || null,
  };
  if (input.apiKey?.trim()) {
    next.apiKeyEnc = encryptSecret(input.apiKey.trim());
  }

  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.digistore24 },
    data: { config: next as Prisma.InputJsonValue },
  });

  return getDigistore24PublicConfig();
}
