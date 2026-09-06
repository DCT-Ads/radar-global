-- CreateEnum
CREATE TYPE "LaunchStatus" AS ENUM (
  'DISCOVERY',
  'EARLY_SIGNAL',
  'PRE_LAUNCH',
  'LAUNCH_IMMINENT',
  'LAUNCHED',
  'GROWING',
  'SATURATED',
  'DECLINING'
);

-- AlterTable
ALTER TABLE "Launch" ALTER COLUMN "lifecycle" DROP DEFAULT;

ALTER TABLE "Launch"
  ALTER COLUMN "lifecycle" TYPE "LaunchStatus"
  USING (
    CASE "lifecycle"::text
      WHEN 'LIVE' THEN 'LAUNCHED'
      WHEN 'PEAK' THEN 'GROWING'
      ELSE "lifecycle"::text
    END::"LaunchStatus"
  );

ALTER TABLE "Launch" ALTER COLUMN "lifecycle" SET DEFAULT 'DISCOVERY';

-- DropEnum
DROP TYPE "Lifecycle";
