export type CollectorDropStats = {
  fetched: number;
  keywordMiss: number;
  noNiche: number;
  tooOld: number;
  apexMiss: number;
  kept: number;
};

export function emptyDropStats(): CollectorDropStats {
  return {
    fetched: 0,
    keywordMiss: 0,
    noNiche: 0,
    tooOld: 0,
    apexMiss: 0,
    kept: 0,
  };
}

export function addDropStats(
  target: CollectorDropStats,
  extra: CollectorDropStats,
): CollectorDropStats {
  target.fetched += extra.fetched;
  target.keywordMiss += extra.keywordMiss;
  target.noNiche += extra.noNiche;
  target.tooOld += extra.tooOld;
  target.apexMiss += extra.apexMiss;
  target.kept += extra.kept;
  return target;
}

export function formatDropStats(source: string, stats: CollectorDropStats): string {
  return (
    `${source} fetched=${stats.fetched} keywordMiss=${stats.keywordMiss} ` +
    `noNiche=${stats.noNiche} tooOld=${stats.tooOld} apexMiss=${stats.apexMiss} kept=${stats.kept}`
  );
}

export function logDropStats(source: string, stats: CollectorDropStats) {
  console.log(`[${source}] ${formatDropStats(source, stats)}`);
}

export function lastErrorIfEmpty(source: string, stats: CollectorDropStats): string | null {
  if (stats.kept > 0) {
    return null;
  }
  return formatDropStats(source, stats);
}
