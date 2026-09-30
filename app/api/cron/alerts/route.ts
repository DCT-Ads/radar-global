import { NextResponse } from "next/server";
import { runAlertSweep } from "@/lib/alerts/run";
import { isCronAuthorized } from "@/lib/cron/auth";

export const maxDuration = 60;

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry") === "1";
  const rawLimit = Number(url.searchParams.get("limit"));
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(100, Math.floor(rawLimit)) : undefined;
  try {
    const outcome = await runAlertSweep({ dryRun, limit });
    return NextResponse.json(outcome);
  } catch (error) {
    const message = error instanceof Error ? error.message : "alerts_failed";
    console.error("[alerts] job failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
