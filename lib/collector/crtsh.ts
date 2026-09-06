import { fetchCrtshEntries, type CrtshEntry } from "@/lib/collectors/crtsh";
import { apexDomain, cleanHost } from "@/lib/collectors/domains";

export type RawLaunch = {
  domain: string;
  niche: string;
  issuedAt: Date | null;
};

const KEYWORD_GAP_MS = 1_500;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Consulta o crt.sh para UMA keyword (retry/429 fica em fetchCrtshEntries). */
async function fetchKeyword(keyword: string): Promise<CrtshEntry[]> {
  return fetchCrtshEntries(keyword);
}

/** Parse: extrai apex domains limpos, únicos, com nicho. */
export function parseCerts(certs: CrtshEntry[], niche: string): RawLaunch[] {
  const seen = new Set<string>();
  const out: RawLaunch[] = [];

  for (const cert of certs) {
    const names = String(cert.name_value ?? "").split("\n");
    for (const raw of names) {
      const host = cleanHost(raw);
      if (!host) {
        continue;
      }
      const domain = apexDomain(host);
      if (seen.has(domain)) {
        continue;
      }
      seen.add(domain);
      const issuedAt = cert.not_before ? new Date(cert.not_before) : null;
      out.push({
        domain,
        niche,
        issuedAt: issuedAt && !Number.isNaN(issuedAt.getTime()) ? issuedAt : null,
      });
    }
  }
  return out;
}

/** Coleta todos os nichos. Não é o caminho do worker admin (evita 15 hits no crt.sh). */
export async function collectAll(
  niches: Record<string, string[]>,
): Promise<RawLaunch[]> {
  const all: RawLaunch[] = [];

  for (const [niche, keywords] of Object.entries(niches)) {
    for (const keyword of keywords) {
      try {
        const certs = await fetchKeyword(keyword);
        all.push(...parseCerts(certs, niche));
        console.log(`✔ ${niche}/${keyword}: ${certs.length} certs`);
      } catch (error) {
        console.error(
          `✖ ${niche}/${keyword}:`,
          error instanceof Error ? error.message : "unknown error",
        );
      }
      await sleep(KEYWORD_GAP_MS);
    }
  }

  return all;
}
