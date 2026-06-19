import { Injectable } from "@nestjs/common";
import type {
  AttendanceMineResponse,
  ClassAttendanceResponse,
  SchoolAttendanceSummary,
  FinalAtt,
} from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Laporan kehadiran (BAGIAN 8.2) — baca dari `DailyAttendanceStatus` (materialized 2e).
 * ADR-005 / 13.2: TIDAK pernah mengembalikan nama/NIS siswa — hanya userId pseudonim.
 * Scope (siswa-diri / kelas-guru / sekolah) ditegakkan RolesGuard+@Scope di controller.
 */
@Injectable()
export class AttendanceReadService {
  constructor(private readonly prisma: PrismaService) {}

  /** Rekap kehadiran satu siswa dalam sebulan (YYYY-MM). */
  async mine(userId: string, month: string): Promise<AttendanceMineResponse> {
    const rows = await this.prisma.dailyAttendanceStatus.findMany({
      where: { userId, date: { startsWith: month } },
      orderBy: { date: "asc" },
      select: { date: true, finalStatus: true },
    });
    return { month, days: rows as { date: string; finalStatus: FinalAtt }[] };
  }

  /** Rekap satu kelas pada satu tanggal. Siswa tanpa catatan → ABSENT_NO_INFO. */
  async classDay(schoolId: string, classId: string, date: string): Promise<ClassAttendanceResponse> {
    const students = await this.prisma.user.findMany({
      where: { schoolId, classId, role: "STUDENT", deletedAt: null },
      select: { id: true },
      orderBy: { username: "asc" }, // username = NIS-pseudonim (bukan nama)
    });
    const statuses = await this.prisma.dailyAttendanceStatus.findMany({
      where: { schoolId, date, userId: { in: students.map((s) => s.id) } },
      select: { userId: true, finalStatus: true, firstInAt: true },
    });
    const byUser = new Map(statuses.map((s) => [s.userId, s]));
    const rowsOut = students.map((s) => {
      const st = byUser.get(s.id);
      return {
        userId: s.id,
        finalStatus: (st?.finalStatus ?? "ABSENT_NO_INFO") as FinalAtt,
        firstInAt: st?.firstInAt ? st.firstInAt.toISOString() : null,
      };
    });
    return { classId, date, students: rowsOut };
  }

  /** Ringkasan jumlah per status untuk seluruh sekolah pada satu tanggal. */
  async schoolSummary(schoolId: string, date: string): Promise<SchoolAttendanceSummary> {
    const grouped = await this.prisma.dailyAttendanceStatus.groupBy({
      by: ["finalStatus"],
      where: { schoolId, date },
      _count: { _all: true },
    });
    const counts = { PRESENT: 0, LATE: 0, PERMIT: 0, SICK: 0, ABSENT_NO_INFO: 0 };
    for (const g of grouped) {
      counts[g.finalStatus as keyof typeof counts] = g._count._all;
    }
    const total = counts.PRESENT + counts.LATE + counts.PERMIT + counts.SICK + counts.ABSENT_NO_INFO;
    return { date, counts, total };
  }
}
