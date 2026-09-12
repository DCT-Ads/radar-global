import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const PREFIX = "v1";

function encryptionSecret() {
  const secret =
    process.env.INTEGRATIONS_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    (process.env.NODE_ENV === "production" ? "" : "dev-only-change-JWT_SECRET");
  if (!secret) {
    throw new Error("INTEGRATIONS_SECRET or JWT_SECRET is required");
  }
  return secret;
}

function keyFromSecret() {
  return scryptSync(encryptionSecret(), "radar-global-integrations", 32);
}

export function encryptSecret(plain: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", keyFromSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}:${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

export function decryptSecret(payload: string) {
  const [prefix, ivHex, tagHex, dataHex] = payload.split(":");
  if (prefix !== PREFIX || !ivHex || !tagHex || !dataHex) {
    throw new Error("Invalid secret payload");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    keyFromSecret(),
    Buffer.from(ivHex, "hex"),
  );
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

export function maskSecret(value: string) {
  const trimmed = value.trim();
  if (trimmed.length <= 4) {
    return "••••";
  }
  return `••••${trimmed.slice(-4)}`;
}
