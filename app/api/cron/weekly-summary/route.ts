import { NextResponse } from "next/server";
import { isCronAuthorized } from "@/lib/cron/auth";
import { runWeeklySummary } from "@/lib/email/weekly-summary";

export const maxDuration = 60;

function parseLimit(value: string | null) {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }
  return Math.min(50, Math.floor(parsed));
}

export async function GET(request: Request) {
  if (!isCronAuthorized(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(request.url);
  const dryRun = url.searchParams.get("dry") === "1";
  const limit = parseLimit(url.searchParams.get("limit"));

  try {
    const outcome = await runWeeklySummary({ dryRun, limit });
    return NextResponse.json(outcome);
  } catch (error) {
    const message = error instanceof Error ? error.message : "weekly_summary_failed";
    console.error("[weekly-summary] job failed", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
