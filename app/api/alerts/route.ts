import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, response } = await requireUser();
  if (!user || response) return response;

  const [unread, items] = await Promise.all([
    prisma.inboxNotice.count({ where: { userId: user.id, readAt: null } }),
    prisma.inboxNotice.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        kind: true,
        readAt: true,
        createdAt: true,
      },
    }),
  ]);

  return NextResponse.json({
    unread,
    items: items.map((item) => ({
      ...item,
      readAt: item.readAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (!user || response) return response;
  const body: unknown = await req.json().catch(() => null);
  const all = Boolean(body && typeof body === "object" && "all" in body && body.all === true);
  const id =
    body && typeof body === "object" && "id" in body && typeof body.id === "string" ? body.id : "";
  const now = new Date();
  if (all) {
    await prisma.inboxNotice.updateMany({
      where: { userId: user.id, readAt: null },
      data: { readAt: now },
    });
  } else if (id) {
    await prisma.inboxNotice.updateMany({
      where: { id, userId: user.id, readAt: null },
      data: { readAt: now },
    });
  }
  return NextResponse.json({ ok: true });
}
