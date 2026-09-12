import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret, maskSecret } from "@/lib/integrations/secret";
import {
  PLATFORM_LABELS,
  PLATFORMS,
  requiredFields,
  type PlatformField,
  type PlatformId,
} from "@/lib/integrations/platforms";
import { SOURCE_SLUGS } from "@/lib/sources";

export type IntegrationCreds = Partial<Record<PlatformField, string>>;

export type PublicIntegration = {
  platform: PlatformId;
  nickname: string;
  connected: boolean;
  validated: boolean;
  fromEnv: boolean;
  has: Record<string, boolean>;
  hints: Record<string, string>;
};

export function integrationSlug(platform: PlatformId) {
  return `integration:${platform}`;
}

type StoredConfig = {
  secretsEnc: Record<string, string>;
  nickname: string | null;
  validatedAt: string | null;
};

function asSecrets(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  const record = value as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [key, item] of Object.entries(record)) {
    if (typeof item === "string" && item) {
      out[key] = item;
    }
  }
  return out;
}

function asStored(value: unknown): StoredConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { secretsEnc: {}, nickname: null, validatedAt: null };
  }
  const record = value as Record<string, unknown>;
  return {
    secretsEnc: asSecrets(record.secretsEnc),
    nickname: typeof record.nickname === "string" ? record.nickname : null,
    validatedAt: typeof record.validatedAt === "string" ? record.validatedAt : null,
  };
}

function envFallback(platform: PlatformId, field: PlatformField): string | null {
  if (platform === "digistore24" && field === "apiKey") {
    return process.env.DIGISTORE24_API_KEY?.trim() || null;
  }
  return null;
}

async function legacyDigistore24() {
  const source = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.digistore24 },
    select: { config: true },
  });
  const config =
    source?.config && typeof source.config === "object" && !Array.isArray(source.config)
      ? (source.config as Record<string, unknown>)
      : {};
  const payload = typeof config.apiKeyEnc === "string" ? config.apiKeyEnc : "";
  let apiKey: string | null = null;
  if (payload) {
    try {
      apiKey = decryptSecret(payload);
    } catch {
      apiKey = null;
    }
  }
  return {
    apiKey,
    nickname: typeof config.nickname === "string" ? config.nickname : null,
  };
}

export async function getDecryptedCreds(platform: PlatformId): Promise<IntegrationCreds> {
  const row = await prisma.source.findUnique({
    where: { slug: integrationSlug(platform) },
    select: { config: true },
  });
  const stored = asStored(row?.config);
  const creds: IntegrationCreds = {};
  for (const field of PLATFORMS[platform].fields) {
    const fromEnv = envFallback(platform, field);
    if (fromEnv) {
      creds[field] = fromEnv;
      continue;
    }
    const payload = stored.secretsEnc[field];
    if (payload) {
      try {
        creds[field] = decryptSecret(payload);
        continue;
      } catch {
        // ignore corrupt payload for this field
      }
    }
    if (platform === "digistore24" && field === "apiKey") {
      const legacy = await legacyDigistore24();
      if (legacy.apiKey) {
        creds[field] = legacy.apiKey;
      }
    }
  }
  return creds;
}

export async function getPublicIntegration(platform: PlatformId): Promise<PublicIntegration> {
  const row = await prisma.source.findUnique({
    where: { slug: integrationSlug(platform) },
    select: { config: true },
  });
  const stored = asStored(row?.config);
  const decrypted = await getDecryptedCreds(platform);
  const has: Record<string, boolean> = {};
  const hints: Record<string, string> = {};
  let fromEnv = false;

  for (const field of PLATFORMS[platform].fields) {
    const envValue = envFallback(platform, field);
    const value = decrypted[field] ?? "";
    has[field] = Boolean(value);
    if (value) {
      hints[field] = maskSecret(value);
    }
    if (envValue) {
      fromEnv = true;
    }
  }

  const connected = requiredFields(platform).every((field) => has[field]);
  let nickname = stored.nickname ?? "";
  if (!nickname && platform === "digistore24") {
    nickname = (await legacyDigistore24()).nickname ?? "";
  }

  return {
    platform,
    nickname,
    connected,
    validated: Boolean(stored.validatedAt) && connected,
    fromEnv,
    has,
    hints,
  };
}

export async function saveIntegration(input: {
  platform: PlatformId;
  creds: IntegrationCreds;
  nickname?: string;
  validated?: boolean;
}) {
  const slug = integrationSlug(input.platform);
  const current = await prisma.source.findUnique({
    where: { slug },
    select: { config: true },
  });
  const stored = asStored(current?.config);
  let replacedSecret = false;

  for (const field of PLATFORMS[input.platform].fields) {
    const next = input.creds[field]?.trim();
    if (!next) {
      continue;
    }
    stored.secretsEnc[field] = encryptSecret(next);
    replacedSecret = true;
  }

  stored.nickname =
    input.nickname !== undefined
      ? input.nickname.trim() || null
      : stored.nickname;
  stored.validatedAt = input.validated
    ? new Date().toISOString()
    : replacedSecret
      ? null
      : stored.validatedAt;

  await prisma.source.upsert({
    where: { slug },
    create: {
      slug,
      name: PLATFORM_LABELS[input.platform],
      reliability: 0,
      config: stored as Prisma.InputJsonValue,
    },
    update: {
      name: PLATFORM_LABELS[input.platform],
      config: stored as Prisma.InputJsonValue,
    },
  });

  if (input.platform === "digistore24") {
    await syncDigistore24Source(stored.secretsEnc.apiKey, stored.nickname);
  }

  return getPublicIntegration(input.platform);
}

async function syncDigistore24Source(
  apiKeyEnc: string | undefined,
  nickname: string | null,
) {
  const source = await prisma.source.findUnique({
    where: { slug: SOURCE_SLUGS.digistore24 },
    select: { id: true, config: true },
  });
  if (!source) {
    return;
  }
  const current =
    source.config && typeof source.config === "object" && !Array.isArray(source.config)
      ? { ...(source.config as Record<string, unknown>) }
      : {};
  if (apiKeyEnc) {
    current.apiKeyEnc = apiKeyEnc;
  }
  current.nickname = nickname;
  await prisma.source.update({
    where: { slug: SOURCE_SLUGS.digistore24 },
    data: { config: current as Prisma.InputJsonValue },
  });
}

export function mergeCreds(
  stored: IntegrationCreds,
  submitted: IntegrationCreds,
): IntegrationCreds {
  const merged: IntegrationCreds = { ...stored };
  for (const [key, value] of Object.entries(submitted)) {
    const trimmed = value?.trim();
    if (trimmed) {
      merged[key as PlatformField] = trimmed;
    }
  }
  return merged;
}

export function missingRequiredFields(platform: PlatformId, creds: IntegrationCreds) {
  return requiredFields(platform).filter((field) => !creds[field]?.trim());
}
