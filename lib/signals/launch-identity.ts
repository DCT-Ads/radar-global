import type { Signal } from "@prisma/client";
import { domainSlug } from "@/lib/collectors/domains";
import { YOUTUBE_SOURCE } from "@/lib/collectors/youtube";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function stringField(raw: Record<string, unknown> | null, key: string) {
  const value = raw?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

export function launchIdentityFromSignal(signal: Pick<Signal, "source" | "value" | "domain" | "rawData">) {
  const raw = asRecord(signal.rawData);
  const title = stringField(raw, "title") ?? stringField(raw, "headline");

  if (signal.source === YOUTUBE_SOURCE) {
    const videoId = signal.value;
    return {
      producerDomain: "youtube.com",
      producerName: stringField(raw, "channelTitle") ?? "YouTube",
      launchDomain: `youtube.com/watch?v=${videoId}`,
      launchSlug: `yt-${videoId}`,
      launchTitle: title ?? `YouTube · ${videoId}`,
      website: "https://www.youtube.com",
      evidenceTitle: title ?? "Verified YouTube signal",
    };
  }

  const domain = signal.domain ?? signal.value;
  return {
    producerDomain: domain,
    producerName: domain,
    launchDomain: domain,
    launchSlug: domainSlug(domain),
    launchTitle: title ?? domain,
    website: `https://${domain}`,
    evidenceTitle: title ?? "Verified public signal",
  };
}
