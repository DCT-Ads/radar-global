import { prisma } from "../lib/prisma";
import { backupSignals } from "./backup-signals";
import { confirmSignalDelete } from "./confirm-signal-delete";

async function main() {
  await backupSignals("cleanup-muncheye-directory-junk");
  const doomed = await prisma.signal.count({
    where: {
      source: "muncheye",
      domain: { in: ["muncheye.com", "www.muncheye.com"] },
    },
  });
  if (!doomed) {
    console.log("Nenhuma linha muncheye.com para apagar.");
    return;
  }
  await confirmSignalDelete(`Vai apagar ${doomed} signals com domain=muncheye.com.`);
  const removed = await prisma.signal.deleteMany({
    where: {
      source: "muncheye",
      domain: { in: ["muncheye.com", "www.muncheye.com"] },
    },
  });
  const leftover = await prisma.signal.groupBy({
    by: ["source", "status"],
    _count: { _all: true },
  });
  console.log(
    JSON.stringify(
      {
        removedDirectoryRows: removed.count,
        leftover: leftover.map((row) => ({
          source: row.source,
          status: row.status,
          count: row._count._all,
        })),
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
