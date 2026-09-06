-- DropForeignKey
ALTER TABLE "Evidence" DROP CONSTRAINT "Evidence_signalId_fkey";
ALTER TABLE "Signal" DROP CONSTRAINT "Signal_launchId_fkey";
ALTER TABLE "Signal" DROP CONSTRAINT "Signal_sourceId_fkey";

-- Orphan old evidence links before replacing Signal
UPDATE "Evidence" SET "signalId" = NULL;

-- DropTable
DROP TABLE "Signal";

-- DropEnum
DROP TYPE "SignalType";

-- CreateEnum
CREATE TYPE "SignalType" AS ENUM ('NEW_DOMAIN', 'NEW_SUBDOMAIN', 'RSS_ITEM', 'YOUTUBE_VIDEO', 'LANDING_PAGE', 'WHOIS_CHANGE');

-- CreateEnum
CREATE TYPE "SignalStatus" AS ENUM ('NEW', 'ENRICHING', 'CANDIDATE', 'VERIFIED', 'DISCARDED');

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "type" "SignalType" NOT NULL,
    "source" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "rawData" JSONB,
    "domain" TEXT,
    "url" TEXT,
    "keyword" TEXT,
    "niche" TEXT,
    "countryHint" TEXT,
    "langHint" TEXT,
    "confidence" INTEGER NOT NULL DEFAULT 0,
    "status" "SignalStatus" NOT NULL DEFAULT 'NEW',
    "producerId" TEXT,
    "launchId" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Signal_source_value_key" ON "Signal"("source", "value");
CREATE INDEX "Signal_type_idx" ON "Signal"("type");
CREATE INDEX "Signal_status_idx" ON "Signal"("status");
CREATE INDEX "Signal_niche_idx" ON "Signal"("niche");
CREATE INDEX "Signal_countryHint_idx" ON "Signal"("countryHint");

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_launchId_fkey" FOREIGN KEY ("launchId") REFERENCES "Launch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_signalId_fkey" FOREIGN KEY ("signalId") REFERENCES "Signal"("id") ON DELETE SET NULL ON UPDATE CASCADE;
