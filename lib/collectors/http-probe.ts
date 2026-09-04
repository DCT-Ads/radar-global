export type ProbePathResult = {
  path: string;
  url: string;
  live: boolean;
  status: number | null;
  title: string | null;
};

export type HttpProbeResult = {
  landing: ProbePathResult;
  checkout: ProbePathResult;
  go: ProbePathResult;
  pay: ProbePathResult;
};

const PROBE_TIMEOUT_MS = 8_000;
const TITLE_RE = /<title[^>]*>([^<]+)<\/title>/i;

async function probeUrl(url: string): Promise<Omit<ProbePathResult, "path">> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": "RadarGlobalBot/1.0 (availability probe)",
        Accept: "text/html,application/xhtml+xml",
      },
      cache: "no-store",
    });

    const live = response.status >= 200 && response.status < 400;
    let title: string | null = null;
    if (live) {
      const html = (await response.text()).slice(0, 8_000);
      const match = TITLE_RE.exec(html);
      title = match?.[1]?.trim().replace(/\s+/g, " ").slice(0, 160) ?? null;
    }

    return {
      url: response.url || url,
      live,
      status: response.status,
      title,
    };
  } catch {
    return {
      url,
      live: false,
      status: null,
      title: null,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function probeLaunch(domain: string): Promise<HttpProbeResult> {
  const origin = `https://${domain}`;
  const [landing, checkout, go, pay] = await Promise.all([
    probeUrl(`${origin}/`),
    probeUrl(`${origin}/checkout`),
    probeUrl(`${origin}/go`),
    probeUrl(`${origin}/pay`),
  ]);

  return {
    landing: { path: "/", ...landing },
    checkout: { path: "/checkout", ...checkout },
    go: { path: "/go", ...go },
    pay: { path: "/pay", ...pay },
  };
}
