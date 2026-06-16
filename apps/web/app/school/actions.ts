"use server";

import { revalidatePath } from "next/cache";
import type {
  Class,
  ClassCreateRequest,
  ClassPromoteRequest,
  ClassPromoteResult,
  ClassUpdateRequest,
  ImportJobStatusResponse,
  ImportStartResponse,
  InviteCodeBatchResponse,
  InviteCodeGenerateRequest,
} from "@magnoo/shared";
import { apiAction, apiFetch, type ActionResult } from "@/lib/api";

export async function createClassAction(dto: ClassCreateRequest): Promise<ActionResult<Class>> {
  const res = await apiAction<Class>("/school/classes", { json: dto });
  if (res.ok) revalidatePath("/school/kelas");
  return res;
}

export async function updateClassAction(id: string, dto: ClassUpdateRequest): Promise<ActionResult<Class>> {
  const res = await apiAction<Class>(`/school/classes/${id}`, { method: "PATCH", json: dto });
  if (res.ok) revalidatePath("/school/kelas");
  return res;
}

export async function deleteClassAction(id: string): Promise<ActionResult<null>> {
  const res = await apiAction<null>(`/school/classes/${id}`, { method: "DELETE" });
  if (res.ok) revalidatePath("/school/kelas");
  return res;
}

/** Wizard kenaikan kelas: dryRun=true pratinjau, dryRun=false konfirmasi. */
export async function promoteAction(dto: ClassPromoteRequest): Promise<ActionResult<ClassPromoteResult>> {
  const res = await apiAction<ClassPromoteResult>("/school/classes/promote", { json: dto });
  if (res.ok && !dto.dryRun) revalidatePath("/school/kelas");
  return res;
}

// ── Impor XLSX siswa (BAGIAN 8.2 /school/users/import) ──────────────────────

/** Mulai impor: teruskan file multipart ke backend → jobId. */
export async function startImportAction(formData: FormData): Promise<ActionResult<ImportStartResponse>> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Pilih file .xlsx terlebih dahulu." };
  }
  const fd = new FormData();
  fd.append("file", file, file.name);
  const res = await apiFetch("/school/users/import", { method: "POST", body: fd });
  const data: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = (data as { error?: { message?: string } } | null)?.error?.message ?? `Gagal mengunggah (${res.status}).`;
    return { ok: false, error: msg };
  }
  return { ok: true, data: data as ImportStartResponse };
}

/** Pantau progres job impor. */
export async function importStatusAction(jobId: string): Promise<ActionResult<ImportJobStatusResponse>> {
  return apiAction<ImportJobStatusResponse>(`/school/users/import/${jobId}`, { method: "GET" });
}

// ── Kode undangan ortu (BAGIAN 8.2 /school/invite-codes) ────────────────────

export async function generateInvitesAction(
  dto: InviteCodeGenerateRequest,
): Promise<ActionResult<InviteCodeBatchResponse>> {
  return apiAction<InviteCodeBatchResponse>("/school/invite-codes/generate", { json: dto });
}
