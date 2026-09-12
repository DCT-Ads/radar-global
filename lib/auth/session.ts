import { prisma } from "@/lib/prisma";
import { getSession } from "./cookies";

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      plan: true,
      locale: true,
      subscription: {
        select: {
          status: true,
          plan: {
            select: {
              slug: true,
              name: true,
            },
          },
        },
      },
    },
  });
}
