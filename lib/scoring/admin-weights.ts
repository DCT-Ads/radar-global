/**
 * Pesos oficiais do Early Signal (config admin).
 * O motor só lê daqui — não hardcodar wi na fórmula.
 */
export const ADMIN_EARLY_SIGNAL_WEIGHTS = {
  freshness: 30,
  evidenceDensity: 25,
  upcomingLanding: 25,
  sourceReliability: 20,
} as const;

export type EarlySignalWeightKey = keyof typeof ADMIN_EARLY_SIGNAL_WEIGHTS;

export function getEarlySignalWeights() {
  return { ...ADMIN_EARLY_SIGNAL_WEIGHTS };
}
