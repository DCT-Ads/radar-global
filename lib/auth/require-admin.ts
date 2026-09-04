import { NextResponse } from "next/server";
import { getCurrentUser } from "./session";

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) {
    return { user: null, response: NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }) };
  }
  if (user.role !== "ADMIN") {
    return { user: null, response: NextResponse.json({ error: "FORBIDDEN" }, { status: 403 }) };
  }
  return { user, response: null };
}
