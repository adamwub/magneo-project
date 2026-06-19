"use server";

import { revalidatePath } from "next/cache";
import type { Announcement, AnnouncementCreateRequest } from "@magnoo/shared";
import { apiAction, type ActionResult } from "@/lib/api";

/** Buat pengumuman (scope×role ditegakkan backend). */
export async function createAnnouncementAction(
  dto: AnnouncementCreateRequest,
): Promise<ActionResult<Announcement>> {
  const res = await apiAction<Announcement>("/announcements", { json: dto });
  if (res.ok) revalidatePath("/school/pengumuman");
  return res;
}

/** Tarik pengumuman (≤15 menit; backend yang menjaga jendela). */
export async function retractAnnouncementAction(id: string): Promise<ActionResult<{ retracted: true }>> {
  const res = await apiAction<{ retracted: true }>(`/announcements/${id}/retract`, {});
  if (res.ok) revalidatePath("/school/pengumuman");
  return res;
}
