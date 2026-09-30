-- CreateEnum
CREATE TYPE "NeuroMood" AS ENUM ('OTIMA', 'NEUTRA', 'ANSIOSA', 'ESTRESSADA');

-- CreateTable
CREATE TABLE "NeuroCheck" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mood" "NeuroMood" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NeuroCheck_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NeuroCheck_userId_createdAt_idx" ON "NeuroCheck"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "NeuroCheck" ADD CONSTRAINT "NeuroCheck_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
