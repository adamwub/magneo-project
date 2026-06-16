import { cookies } from "next/headers";
import { API_PREFIX } from "@magnoo/shared";
import { ACCESS_COOKIE } from "./session";

/** Alamat backend API (default dev). Prefix /api/v1 dari paket bersama. */
export const API_BASE = process.env.API_URL ?? "http://localhost:3000";

/**
 * Pemanggil API backend dari sisi SERVER (server component / route handler).
 * Menempelkan access token dari cookie httpOnly ke header Authorization — token
 * tak pernah menyentuh JavaScript klien (pola BFF). Selalu no-store (data dinamis).
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  return fetch(`${API_BASE}${API_PREFIX}${path}`, { ...init, headers, cache: "no-store" });
}

/** Versi yang otomatis JSON-parse + lempar pesan ramah bila gagal. */
export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
    throw new Error(body?.error?.message ?? `Permintaan gagal (${res.status}).`);
  }
  return res.json() as Promise<T>;
}
