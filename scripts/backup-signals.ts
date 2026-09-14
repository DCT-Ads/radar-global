import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../lib/prisma";

export async function backupSignals(reason = "manual") {
  const signals = await prisma.signal.findMany({
    orderBy: { createdAt: "asc" },
  });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(process.cwd(), "backups");
  await mkdir(dir, { recursive: true });
  const file = path.join(dir, `signals-${stamp}.json`);
  await writeFile(
    file,
    JSON.stringify(
      {
        reason,
        exportedAt: new Date().toISOString(),
        count: signals.length,
        signals,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`[backup] ${signals.length} signals → ${file}`);
  return file;
}

if (process.argv[1]?.includes("backup-signals")) {
  backupSignals("manual")
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
