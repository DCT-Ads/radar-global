import { prisma } from "../lib/prisma";

async function main() {
  const total = await prisma.signal.count();
  const grouped = await prisma.signal.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const raw = await prisma.$queryRaw<Array<{ status: string; n: bigint }>>`
    SELECT status::text AS status, COUNT(*)::bigint AS n
    FROM "Signal"
    GROUP BY status
    ORDER BY n DESC
  `;

  console.log(
    JSON.stringify(
      {
        total,
        prismaGroupBy: grouped,
        rawSql: raw.map((row) => ({ status: row.status, n: Number(row.n) })),
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main();
