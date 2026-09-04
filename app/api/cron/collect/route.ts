import { NextResponse } from "next/server";
import { enqueueOrRunCollection } from "@/lib/queue/collect";

export const maxDuration = 60;

function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return process.env.NODE_ENV !== "production";
  }
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const outcome = await enqueueOrRunCollection();
    return NextResponse.json(outcome);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const POST = GET;
