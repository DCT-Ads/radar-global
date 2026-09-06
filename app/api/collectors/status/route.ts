import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getCollectorsStatus } from "@/lib/collectors/status";

export async function GET() {
  const { user, response } = await requireAdmin();
  if (!user || response) {
    return response;
  }

  try {
    const status = await getCollectorsStatus();
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "STATUS_FAILED";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
