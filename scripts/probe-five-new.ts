import { prisma } from "../lib/prisma";
import { persistHttpProbe } from "../lib/collectors/persist";
import { probeLaunch } from "../lib/collectors/http-probe";

async function main() {
  const signals = await prisma.signal.findMany({
    where: {
      status: "NEW",
      source: { in: ["crt.sh", "whoisds"] },
    },
    orderBy: { updatedAt: "asc" },
    take: 5,
    select: { id: true, domain: true, value: true, source: true, status: true },
  });

  console.log(`[http_probe] probing ${signals.length} NEW signals`);
  for (const signal of signals) {
    const domain = signal.domain ?? signal.value;
    const probe = await probeLaunch(domain);
    const landing = probe.landing;
    const passes = Boolean(landing.live);
    console.log(
      `[http_probe] ${domain} source=${signal.source} fetch=${landing.status ?? "none"} live=${landing.live} title=${landing.title ?? "—"} critério=${passes ? "PASS" : "FAIL"}`,
    );
    await persistHttpProbe(signal.id, probe);
    const after = await prisma.signal.findUnique({
      where: { id: signal.id },
      select: { status: true },
    });
    console.log(`[http_probe] ${domain} status ${signal.status} → ${after?.status}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
