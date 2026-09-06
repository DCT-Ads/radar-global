-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('OFFICIAL_PAGE', 'RDAP', 'RSS', 'YOUTUBE', 'LANDING_PAGE', 'CRT_SH', 'MANUAL');

-- AlterTable
ALTER TABLE "Evidence" ALTER COLUMN "launchId" DROP NOT NULL;
ALTER TABLE "Evidence" ADD COLUMN "producerId" TEXT;
ALTER TABLE "Evidence" ADD COLUMN "type" "EvidenceType" NOT NULL DEFAULT 'CRT_SH';
ALTER TABLE "Evidence" ADD COLUMN "confidence" INTEGER NOT NULL DEFAULT 0;

-- AddForeignKey
ALTER TABLE "Evidence" ADD CONSTRAINT "Evidence_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "Producer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "Evidence_producerId_idx" ON "Evidence"("producerId");
