import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ACCESS_COOKIE, decodeJwt, homePathForRole, roleCanAccess } from "@/lib/jwt";

/**
 * Penjaga rute dashboard (Fase 1i). Tanpa token → /login. Role tak sesuai area →
 * dialihkan ke home role-nya. Ini lapis kenyamanan UX; otorisasi SUNGGUHAN tetap
 * di backend per request (RBAC 1c). Decode JWT di Edge tanpa verifikasi (hanya UI).
 */
export function middleware(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  const area = pathname.startsWith("/hq") ? "hq" : pathname.startsWith("/school") ? "school" : null;
  if (!area) return NextResponse.next();

  const token = req.cookies.get(ACCESS_COOKIE)?.value;
  const claims = token ? decodeJwt(token) : null;
  const role = claims?.role as string | undefined;

  if (!role) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (!roleCanAccess(area, role)) {
    const url = req.nextUrl.clone();
    url.pathname = homePathForRole(role);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/hq/:path*", "/school/:path*"] };
