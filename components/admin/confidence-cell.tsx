import { isStoredSignalIncomplete } from "@/lib/signals/enrich";

type ConfidenceCellProps = {
  source: string;
  keyword: string | null;
  rawData: unknown;
  confidence: number;
  incompleteLabel: string;
};

export function ConfidenceCell({
  source,
  keyword,
  rawData,
  confidence,
  incompleteLabel,
}: ConfidenceCellProps) {
  if (isStoredSignalIncomplete({ source, keyword, rawData })) {
    return (
      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
        {incompleteLabel}
      </span>
    );
  }
  return <>{confidence}</>;
}
