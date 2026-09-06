import type { Prisma, Source } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DEFAULT_CRTSH_CONFIG } from "@/lib/collectors/config";

export const SOURCE_SLUGS = {
  crtsh: "crtsh",
  httpProbe: "http_probe",
  nrd: "whoisds",
  digistore24: "digistore24",
  youtube: "youtube",
} as const;

const SOURCE_SEED: Array<{
  slug: string;
  name: string;
  reliability: number;
  config: Prisma.InputJsonValue | undefined;
}> = [
  {
    slug: SOURCE_SLUGS.crtsh,
    name: "crt.sh Certificate Transparency",
    reliability: 95,
    config: DEFAULT_CRTSH_CONFIG,
  },
  {
    slug: SOURCE_SLUGS.httpProbe,
    name: "HTTP availability probe",
    reliability: 90,
    config: undefined,
  },
  {
    slug: SOURCE_SLUGS.nrd,
    name: "WhoisDS newly registered domains",
    reliability: 85,
    config: undefined,
  },
  {
    slug: SOURCE_SLUGS.digistore24,
    name: "Digistore24 marketplace",
    reliability: 80,
    config: undefined,
  },
  {
    slug: SOURCE_SLUGS.youtube,
    name: "YouTube Data API mostPopular",
    reliability: 80,
    config: undefined,
  },
];

export async function ensureSources() {
  for (const source of SOURCE_SEED) {
    await prisma.source.upsert({
      where: { slug: source.slug },
      update: {
        name: source.name,
        reliability: source.reliability,
      },
      create: source,
    });
  }
}

export async function getSourceBySlug(slug: string): Promise<Source> {
  const source = await prisma.source.findUnique({ where: { slug } });
  if (!source) {
    throw new Error(`Source ${slug} is not seeded`);
  }
  return source;
}
