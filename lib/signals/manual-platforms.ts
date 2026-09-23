import { PLATFORM_IDS, PLATFORM_LABELS, type PlatformId } from "@/lib/integrations/platforms";

export const MANUAL_PLATFORMS = [...PLATFORM_IDS, "muncheye"] as const;
export type ManualPlatform = (typeof MANUAL_PLATFORMS)[number];

export function isManualPlatform(value: string): value is ManualPlatform {
  return MANUAL_PLATFORMS.includes(value as ManualPlatform);
}

export function platformLabel(platform: ManualPlatform) {
  if (platform === "muncheye") {
    return "MunchEye";
  }
  return PLATFORM_LABELS[platform as PlatformId];
}
