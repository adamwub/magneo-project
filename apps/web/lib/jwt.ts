import type { Role } from "@magnoo/shared";

/** Nama cookie httpOnly (BFF) — token tak pernah terbaca JavaScript klien. */
export const ACCESS_COOKIE = "mg_access";
export const REFRESH_COOKIE = "mg_refresh";

/**
 * Decode payload JWT TANPA verifikasi tanda tangan — HANYA untuk menentukan tampilan
 * (menu/role) & rute. Keamanan SELALU ditegakkan backend per request. Pure (tanpa
 * next/headers) agar aman dipakai di Edge middleware maupun Node.
 */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Home default per role (ke mana diarahkan setelah login). */
export function homePathForRole(role: Role | string): string {
  if (role === "HQ_ADMIN" || role === "HQ_OPS") return "/hq";
  if (role === "SCHOOL_ADMIN" || role === "PRINCIPAL") return "/school";
  return "/login"; // role lain belum punya dashboard web (mobile-only)
}

/** Apakah role boleh mengakses area rute tertentu. */
export function roleCanAccess(area: "hq" | "school", role: string): boolean {
  if (area === "hq") return role === "HQ_ADMIN" || role === "HQ_OPS";
  return role === "SCHOOL_ADMIN" || role === "PRINCIPAL";
}
