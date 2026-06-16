"use server";

import { revalidatePath } from "next/cache";
import type { AdminAccountResponse, CreateSchoolRequest, PairBoxResponse, School } from "@magnoo/shared";
import { apiFetch } from "@/lib/api";

export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string };

async function call<T>(path: string, body?: unknown): Promise<ActionResult<T>> {
  const res = await apiFetch(path, {
    method: "POST",
    headers: { "content-type": "application/json" },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok || data == null) {
    const msg = (data as { error?: { message?: string } } | null)?.error?.message ?? `Permintaan gagal (${res.status}).`;
    return { ok: false, error: msg };
  }
  return { ok: true, data: data as T };
}

/** Langkah 1: buat sekolah (status ONBOARDING). */
export async function createSchoolAction(dto: CreateSchoolRequest): Promise<ActionResult<School>> {
  return call<School>("/hq/schools", dto);
}

/** Langkah 2: pairing Box — token sekali tampil. */
export async function pairBoxAction(schoolId: string, boxSerial: string): Promise<ActionResult<PairBoxResponse>> {
  return call<PairBoxResponse>(`/hq/schools/${schoolId}/pair-box`, { boxSerial });
}

/** Langkah 3: terbitkan akun admin — password sekali tampil. */
export async function createAdminAccountAction(schoolId: string): Promise<ActionResult<AdminAccountResponse>> {
  const res = await call<AdminAccountResponse>(`/hq/schools/${schoolId}/admin-account`);
  if (res.ok) revalidatePath("/hq");
  return res;
}
