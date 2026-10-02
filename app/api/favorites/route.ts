import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/require-user";
import { toggleFavorite } from "@/lib/favorites/monitor";

export async function POST(req: Request) {
  const { user, response } = await requireUser();
  if (!user || response) {
    return response;
  }

  try {
    const body: unknown = await req.json();
    const launchId =
      body && typeof body === "object" && "launchId" in body && typeof body.launchId === "string"
        ? body.launchId.trim()
        : "";

    if (!launchId) {
      return NextResponse.json({ error: "invalid_launch" }, { status: 400 });
    }

    const result = await toggleFavorite(user.id, launchId);
    if ("error" in result) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    return NextResponse.json({ launchId, favorited: result.favorited });
  } catch (error) {
    console.error("[favorites] toggle failed", error);
    return NextResponse.json({ error: "favorite_failed" }, { status: 500 });
  }
}
