import type { EvidenceType, Prisma } from "@prisma/client";

type EvidenceTarget = {
  launchId?: string | null;
  producerId?: string | null;
};

export function assertEvidenceTarget(target: EvidenceTarget) {
  if (!target.launchId && !target.producerId) {
    throw new Error("Evidence requires launchId or producerId");
  }
}

export function evidenceTypeFromSignal(source: string): EvidenceType {
  if (source === "crt.sh") {
    return "CRT_SH";
  }
  if (source === "rdap") {
    return "RDAP";
  }
  if (source === "rss") {
    return "RSS";
  }
  if (source === "youtube") {
    return "YOUTUBE";
  }
  return "MANUAL";
}

export function evidenceCreateData(
  input: EvidenceTarget & {
    sourceId: string;
    signalId?: string | null;
    type: EvidenceType;
    url: string;
    title?: string;
    snippet?: string;
    raw?: Prisma.InputJsonValue;
    confidence: number;
    capturedAt: Date;
  },
): Prisma.EvidenceUncheckedCreateInput {
  assertEvidenceTarget(input);
  return {
    launchId: input.launchId ?? null,
    producerId: input.producerId ?? null,
    sourceId: input.sourceId,
    signalId: input.signalId ?? null,
    type: input.type,
    url: input.url,
    title: input.title,
    snippet: input.snippet,
    raw: input.raw,
    confidence: input.confidence,
    capturedAt: input.capturedAt,
  };
}
