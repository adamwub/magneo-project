import { cookies } from "next/headers";
import type { Role } from "@magnoo/shared";
import { ACCESS_COOKIE, decodeJwt } from "./jwt";

export { ACCESS_COOKIE, REFRESH_COOKIE, decodeJwt, homePathForRole } from "./jwt";

export interface Session {
  userId: string;
  role: Role;
  schoolId: string | null;
}

/** Sesi dari cookie access token (server component / route handler). Null bila tak ada. */
export function getSession(): Session | null {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) return null;
  const claims = decodeJwt(token);
  if (!claims || typeof claims.sub !== "string" || typeof claims.role !== "string") return null;
  return {
    userId: claims.sub,
    role: claims.role as Role,
    schoolId: (claims.schoolId as string | null) ?? null,
  };
}
