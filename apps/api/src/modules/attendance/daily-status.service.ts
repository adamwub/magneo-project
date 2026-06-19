import { Injectable } from "@nestjs/common";
import type { FinalAtt } from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";

/** Event minimal untuk hitung status (subset AttendanceEvent). */
export interface StatusEvent {
  type: "IN" | "OUT" | "CORRECTION";
  status: "PRESENT" | "LATE";
  occurredAt: Date;
}

export interface DailyStatusResult {
  finalStatus: FinalAtt;
  firstInAt: Date | null;
  lastOutAt: Date | null;
}

/**
 * Hitung status kehadiran harian (BAGIAN 10.3) — FUNGSI MURNI, mudah ditest.
 *
 * Aturan:
 *  - Permit APPROVED meng-OVERRIDE kehadiran: SICK→SICK, selain itu→PERMIT.
 *  - Tanpa permit: kehadiran ditentukan event presence (IN/CORRECTION). CORRECTION
 *    terbaru menang atas IN (koreksi guru), jika tidak ada koreksi → IN pertama.
 *  - Tanpa permit & tanpa presence → ABSENT_NO_INFO.
 *  - firstInAt = presence paling awal; lastOutAt = OUT paling akhir (untuk "pulang awal", 10.3).
 */
export function computeDailyFinalStatus(
  events: StatusEvent[],
  approvedPermitType: "SICK" | "FAMILY" | "DISPENSATION" | "OTHER" | null,
): DailyStatusResult {
  const byTime = [...events].sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime());
  const presence = byTime.filter((e) => e.type === "IN" || e.type === "CORRECTION");
  const corrections = presence.filter((e) => e.type === "CORRECTION");
  const ins = presence.filter((e) => e.type === "IN");
  const outs = byTime.filter((e) => e.type === "OUT");

  const firstInAt = presence.length > 0 ? presence[0].occurredAt : null;
  const lastOutAt = outs.length > 0 ? outs[outs.length - 1].occurredAt : null;

  // Status presence: koreksi terbaru menang; jika tidak ada → IN pertama.
  const presenceStatus: "PRESENT" | "LATE" | null =
    corrections.length > 0
      ? corrections[corrections.length - 1].status
      : ins.length > 0
        ? ins[0].status
        : null;

  let finalStatus: FinalAtt;
  if (approvedPermitType) {
    finalStatus = approvedPermitType === "SICK" ? "SICK" : "PERMIT";
  } else if (presenceStatus) {
    finalStatus = presenceStatus;
  } else {
    finalStatus = "ABSENT_NO_INFO";
  }
  return { finalStatus, firstInAt, lastOutAt };
}

/**
 * Materialisasi `DailyAttendanceStatus` per (siswa, tanggal) — BAGIAN 10.3.
 * Dipanggil tiap event masuk (check-in 2d, koreksi 2e) + cron 09:05/16:00 (menyusul).
 */
@Injectable()
export class DailyStatusService {
  constructor(private readonly prisma: PrismaService) {}

  /** Hitung ulang & simpan status harian satu siswa pada satu tanggal sekolah. */
  async recompute(userId: string, schoolId: string, date: string): Promise<DailyStatusResult> {
    const [events, permit] = await Promise.all([
      this.prisma.attendanceEvent.findMany({
        where: { userId, schoolId, date },
        select: { type: true, status: true, occurredAt: true },
      }),
      this.prisma.permit.findFirst({
        where: {
          studentUserId: userId,
          status: "APPROVED",
          dateStart: { lte: date }, // tanggal string ISO → urutan leksikografis = kronologis
          dateEnd: { gte: date },
        },
        select: { type: true },
      }),
    ]);

    const result = computeDailyFinalStatus(events as StatusEvent[], permit?.type ?? null);

    await this.prisma.dailyAttendanceStatus.upsert({
      where: { userId_date: { userId, date } },
      create: {
        userId,
        schoolId,
        date,
        finalStatus: result.finalStatus,
        firstInAt: result.firstInAt,
        lastOutAt: result.lastOutAt,
      },
      update: {
        finalStatus: result.finalStatus,
        firstInAt: result.firstInAt,
        lastOutAt: result.lastOutAt,
      },
    });
    return result;
  }
}
