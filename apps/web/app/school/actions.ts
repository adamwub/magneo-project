"use server";

import { revalidatePath } from "next/cache";
import type {
  Class,
  ClassCreateRequest,
  ClassPromoteRequest,
  ClassPromoteResult,
  ClassUpdateRequest,
} from "@magnoo/shared";
import { apiAction, type ActionResult } from "@/lib/api";

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
