import { getDashboardStats } from "../lib/dashboard/stats";
import { prisma } from "../lib/prisma";

async function main() {
  const stats = await getDashboardStats();
  console.log(
    JSON.stringify(
      {
        total: stats.total,
        hot: stats.hot,
        upcoming: stats.upcoming,
        verified: stats.verified,
        timelineDays: stats.timeline.length,
        timelineSum: stats.timeline.reduce((sum, point) => sum + point.count, 0),
        saturation: stats.saturation,
        niches: stats.niches,
      },
      null,
      2,
    ),
  );
  await prisma.$disconnect();
}

main();
