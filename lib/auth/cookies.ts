import { cookies, headers } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  type SessionPayload,
  signSession,
  verifySession,
} from "./jwt";

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

async function tokenFromRequest() {
  const store = await cookies();
  const fromCookie = store.get(SESSION_COOKIE)?.value;
  if (fromCookie) {
    return fromCookie;
  }
  const authorization = (await headers()).get("authorization");
  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice(7).trim();
  }
  return null;
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = await tokenFromRequest();
  if (!token) {
    return null;
  }
  return verifySession(token);
}
