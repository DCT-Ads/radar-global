import type { Role } from "@prisma/client";
import type { SessionPayload } from "./jwt";

export function isAdmin(session: SessionPayload | null) {
  return session?.role === "ADMIN";
}

export function hasRole(session: SessionPayload | null, role: Role) {
  return session?.role === role;
}
