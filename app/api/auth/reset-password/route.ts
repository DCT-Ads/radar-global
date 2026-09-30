import { NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth/cookies";
import { resetPasswordWithToken } from "@/lib/auth/password-reset";
import { z } from "zod";

const schema = z.object({
  token: z.string().trim().min(32).max(128),
  password: z.string().min(8).max(128),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
    }

    const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password);
    if (!result.ok) {
      return NextResponse.json({ error: "INVALID_TOKEN" }, { status: 400 });
    }

    await setSessionCookie({
      sub: result.user.id,
      email: result.user.email,
      role: result.user.role,
    });

    return NextResponse.json({
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    });
  } catch (error) {
    console.error("[password-reset] reset failed", error);
    return NextResponse.json({ error: "GENERIC" }, { status: 500 });
  }
}
