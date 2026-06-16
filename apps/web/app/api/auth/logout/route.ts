import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_PREFIX } from "@magnoo/shared";
import { API_BASE } from "@/lib/api";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/session";

/** BFF logout: cabut sesi di backend (best-effort) lalu hapus cookie. */
export async function POST(): Promise<NextResponse> {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (token) {
    await fetch(`${API_BASE}${API_PREFIX}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => undefined);
  }
  const out = NextResponse.json({ ok: true });
  out.cookies.delete(ACCESS_COOKIE);
  out.cookies.delete(REFRESH_COOKIE);
  return out;
}
