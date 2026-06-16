import { NextResponse } from "next/server";
import { API_PREFIX } from "@magnoo/shared";
import { API_BASE } from "@/lib/api";
import { ACCESS_COOKIE, REFRESH_COOKIE, decodeJwt, homePathForRole } from "@/lib/session";

const ACCESS_MAX_AGE = 60 * 60; // 1 jam (selaras access token)
const REFRESH_MAX_AGE = 60 * 60 * 24 * 30; // 30 hari

/**
 * BFF login (Fase 1i): teruskan kredensial ke backend, simpan token sebagai cookie
 * httpOnly (tak terbaca JS klien). Body: { identifier, schoolId?, password, deviceId }.
 * - schoolId terisi → login pakai username (admin/siswa) butuh schoolId.
 * - identifier mengandung "@" → email; selain itu → phone (untuk akun dewasa).
 */
export async function POST(req: Request): Promise<NextResponse> {
  const body = (await req.json().catch(() => ({}))) as {
    identifier?: string;
    schoolId?: string;
    password?: string;
    deviceId?: string;
  };
  if (!body.identifier || !body.password || !body.deviceId) {
    return NextResponse.json({ error: { message: "Lengkapi identitas, password, dan perangkat." } }, { status: 400 });
  }

  const loginDto: Record<string, string> = { password: body.password, deviceId: body.deviceId, deviceName: "Web Dashboard" };
  if (body.schoolId) {
    loginDto.username = body.identifier;
    loginDto.schoolId = body.schoolId;
  } else if (body.identifier.includes("@")) {
    loginDto.email = body.identifier;
  } else {
    loginDto.phone = body.identifier;
  }

  const res = await fetch(`${API_BASE}${API_PREFIX}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(loginDto),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => null)) as
    | { accessToken: string; refreshToken: string; role: string; mustChangePassword: boolean }
    | { error?: { message?: string } }
    | null;

  if (!res.ok || !data || !("accessToken" in data)) {
    const msg = (data && "error" in data && data.error?.message) || "Login gagal. Periksa kembali data Anda.";
    return NextResponse.json({ error: { message: msg } }, { status: res.status === 0 ? 502 : res.status });
  }

  const claims = decodeJwt(data.accessToken);
  const role = (claims?.role as string) ?? data.role;
  const homePath = homePathForRole(role as never);
  if (homePath === "/login") {
    return NextResponse.json(
      { error: { message: "Peran ini belum punya dashboard web (gunakan aplikasi)." } },
      { status: 403 },
    );
  }

  const out = NextResponse.json({ role, homePath, mustChangePassword: data.mustChangePassword });
  const secure = process.env.NODE_ENV === "production";
  out.cookies.set(ACCESS_COOKIE, data.accessToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: ACCESS_MAX_AGE });
  out.cookies.set(REFRESH_COOKIE, data.refreshToken, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge: REFRESH_MAX_AGE });
  return out;
}
