import { prisma } from "../lib/prisma";

async function main() {
  const count = await prisma.signal.count();
  const rows = await prisma.signal.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
  });
  console.log("Total de Signals:", count);
  console.log(JSON.stringify(rows, null, 2));
  await prisma.$disconnect();
}

main();
