-- AlterTable
ALTER TABLE "Favorite" ADD COLUMN "lastSaturation" TEXT;
ALTER TABLE "Favorite" ADD COLUMN "lastEarlySignal" INTEGER;

-- CreateTable
CREATE TABLE "AlertPreference" (
    "userId" TEXT NOT NULL,
    "stageAlerts" BOOLEAN NOT NULL DEFAULT true,
    "digestEnabled" BOOLEAN NOT NULL DEFAULT true,
    "digestHour" INTEGER NOT NULL DEFAULT 8,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "sensitivity" TEXT NOT NULL DEFAULT 'ALL',
    "whatsappPhone" TEXT,
    "whatsappOptIn" BOOLEAN NOT NULL DEFAULT false,
    "lastDigestKey" TEXT,
    "quietNoteSentAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlertPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "InboxNotice" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "launchId" TEXT,
    "kind" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "fromStage" TEXT,
    "toStage" TEXT,
    "readAt" TIMESTAMP(3),
    "emailedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InboxNotice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InboxNotice_userId_dedupeKey_key" ON "InboxNotice"("userId", "dedupeKey");
CREATE INDEX "InboxNotice_userId_createdAt_idx" ON "InboxNotice"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "AlertPreference" ADD CONSTRAINT "AlertPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InboxNotice" ADD CONSTRAINT "InboxNotice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
