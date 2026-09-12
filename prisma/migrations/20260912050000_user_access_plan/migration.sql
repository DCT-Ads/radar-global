-- CreateEnum
CREATE TYPE "AccessPlan" AS ENUM ('STANDARD', 'PREMIUM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "plan" "AccessPlan" NOT NULL DEFAULT 'STANDARD';
