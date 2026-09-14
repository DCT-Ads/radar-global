export function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isEnrichedSignal(row: {
  confidence: number;
  niche?: string | null;
  countryHint?: string | null;
  enrichedAt?: Date | null;
}) {
  return (
    row.confidence > 0 ||
    hasText(row.niche) ||
    hasText(row.countryHint) ||
    Boolean(row.enrichedAt)
  );
}

export function keepFilledString(value: string | null | undefined) {
  return hasText(value) ? value.trim() : undefined;
}

export function keepFilledConfidence(value: number | null | undefined) {
  return typeof value === "number" && value > 0 ? value : undefined;
}
