import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/auth/password-reset";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email().max(254),
});

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json().catch(() => null);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: true });
    }
    await requestPasswordReset(parsed.data.email);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[password-reset] forgot failed", error);
    return NextResponse.json({ ok: true });
  }
}
