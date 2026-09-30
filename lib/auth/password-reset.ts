import { createHash, randomBytes } from "node:crypto";
import { hashPassword } from "@/lib/auth/password";
import { emailLocale } from "@/lib/email/weekly-copy";
import { renderPasswordResetEmail } from "@/lib/email/reset-password";
import { sendResendEmail } from "@/lib/email/resend";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 60 * 60 * 1000;
const COOLDOWN_MS = 90 * 1000;

const lastRequestAt = new Map<string, number>();

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function newTokenId() {
  return `prt_${randomBytes(12).toString("hex")}`;
}

type ResetTokenRow = {
  id: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
};

export async function createPasswordSetupToken(userId: string) {
  const token = randomBytes(32).toString("hex");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + TOKEN_TTL_MS);
  const id = newTokenId();

  await prisma.$executeRaw`
    UPDATE "PasswordResetToken"
    SET "usedAt" = ${now}
    WHERE "userId" = ${userId} AND "usedAt" IS NULL
  `;
  await prisma.$executeRaw`
    INSERT INTO "PasswordResetToken" ("id", "userId", "tokenHash", "expiresAt", "createdAt")
    VALUES (${id}, ${userId}, ${hashToken(token)}, ${expiresAt}, ${now})
  `;

  return token;
}

export async function requestPasswordReset(email: string) {
  const normalized = email.trim().toLowerCase();
  const now = Date.now();
  const previous = lastRequestAt.get(normalized) ?? 0;
  if (now - previous < COOLDOWN_MS) {
    return { ok: true as const };
  }
  lastRequestAt.set(normalized, now);

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, email: true, name: true, locale: true },
  });
  if (!user) {
    return { ok: true as const };
  }

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(now + TOKEN_TTL_MS);
  const id = newTokenId();

  await prisma.$executeRaw`
    UPDATE "PasswordResetToken"
    SET "usedAt" = ${new Date()}
    WHERE "userId" = ${user.id} AND "usedAt" IS NULL
  `;
  await prisma.$executeRaw`
    INSERT INTO "PasswordResetToken" ("id", "userId", "tokenHash", "expiresAt", "createdAt")
    VALUES (${id}, ${user.id}, ${tokenHash}, ${expiresAt}, ${new Date()})
  `;

  const emailCopy = renderPasswordResetEmail({
    name: user.name || user.email,
    locale: emailLocale(user.locale),
    token,
  });
  const sent = await sendResendEmail({
    to: user.email,
    subject: emailCopy.subject,
    html: emailCopy.html,
  });
  if (sent.error) {
    console.error("[password-reset] send failed", user.email, sent.error);
  }

  return { ok: true as const };
}

export async function resetPasswordWithToken(token: string, password: string) {
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    return { ok: false as const, error: "INVALID_TOKEN" };
  }

  const tokenHash = hashToken(token.toLowerCase());
  const rows = await prisma.$queryRaw<ResetTokenRow[]>`
    SELECT "id", "userId", "expiresAt", "usedAt"
    FROM "PasswordResetToken"
    WHERE "tokenHash" = ${tokenHash}
    LIMIT 1
  `;
  const row = rows[0];
  if (!row || row.usedAt || new Date(row.expiresAt).getTime() < Date.now()) {
    return { ok: false as const, error: "INVALID_TOKEN" };
  }

  const passwordHash = await hashPassword(password);
  await prisma.$transaction(async (tx) => {
    await tx.$executeRaw`
      UPDATE "User" SET "passwordHash" = ${passwordHash}, "updatedAt" = ${new Date()}
      WHERE "id" = ${row.userId}
    `;
    await tx.$executeRaw`
      UPDATE "PasswordResetToken" SET "usedAt" = ${new Date()}
      WHERE "id" = ${row.id}
    `;
    await tx.$executeRaw`
      UPDATE "PasswordResetToken" SET "usedAt" = ${new Date()}
      WHERE "userId" = ${row.userId} AND "usedAt" IS NULL AND "id" <> ${row.id}
    `;
  });

  const user = await prisma.user.findUnique({
    where: { id: row.userId },
    select: { id: true, email: true, name: true, role: true },
  });
  if (!user) {
    return { ok: false as const, error: "INVALID_TOKEN" };
  }

  await prisma.auditLog.create({
    data: {
      userId: user.id,
      action: "password_reset",
      entity: "User",
      entityId: user.id,
    },
  });

  return { ok: true as const, user };
}
