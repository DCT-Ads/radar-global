import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/cookies";
import { hashPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const parsed = signupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    const freePlan = await prisma.plan.findUnique({
      where: { slug: "FREE" },
    });
    if (!freePlan) {
      return NextResponse.json({ error: "PLAN_NOT_SEEDED" }, { status: 500 });
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        passwordHash,
        subscription: {
          create: {
            planId: freePlan.id,
            status: "ACTIVE",
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    await setSessionCookie({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
    }
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }
}
