import { Injectable, HttpStatus } from "@nestjs/common";
import type { ThreadStartRequest, SendMessageRequest, Thread, Message, JwtClaims } from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { apiError } from "../../common/api-error";

/**
 * Pesan ortu↔wali kelas — Thread PARENT_HOMEROOM (BAGIAN 10.7 & 12A.5).
 * Guardrail 13.5: HANYA tipe PARENT_HOMEROOM di Fase 2; tidak ada siswa di kanal ini;
 * tidak ada chat tersembunyi. Semua pesan tercatat (tabel Message, append-only).
 */
@Injectable()
export class ThreadService {
  constructor(private readonly prisma: PrismaService) {}

  /** POST /threads — ortu memulai thread dengan wali kelas anaknya. */
  async start(parent: JwtClaims, dto: ThreadStartRequest): Promise<Thread> {
    if (parent.role !== "PARENT") {
      throw apiError("FORBIDDEN", "Hanya orang tua yang memulai thread ini.", HttpStatus.FORBIDDEN);
    }
    const link = await this.prisma.parentLink.findUnique({
      where: { parentUserId_studentUserId: { parentUserId: parent.sub, studentUserId: dto.studentUserId } },
      select: { status: true },
    });
    if (!link || link.status !== "ACTIVE") {
      throw apiError("FORBIDDEN", "Bukan orang tua sah dari siswa ini.", HttpStatus.FORBIDDEN);
    }
    const student = await this.prisma.user.findUnique({
      where: { id: dto.studentUserId },
      select: { schoolId: true, classId: true },
    });
    if (!student?.schoolId || !student.classId) {
      throw apiError("NOT_FOUND", "Siswa/kelas tidak ditemukan.", HttpStatus.NOT_FOUND);
    }
    const klass = await this.prisma.class.findUnique({
      where: { id: student.classId },
      select: { homeroomTeacherId: true },
    });
    if (!klass?.homeroomTeacherId) {
      throw apiError("NOT_FOUND", "Wali kelas belum ditetapkan untuk kelas ini.", HttpStatus.NOT_FOUND);
    }

    // Pakai ulang thread yang sudah ada (ortu+kelas yang sama) agar tak duplikat.
    let thread = await this.prisma.thread.findFirst({
      where: {
        type: "PARENT_HOMEROOM",
        schoolId: student.schoolId,
        contextId: student.classId,
        participantIds: { has: parent.sub },
      },
    });
    if (!thread) {
      thread = await this.prisma.thread.create({
        data: {
          schoolId: student.schoolId,
          type: "PARENT_HOMEROOM",
          contextId: student.classId,
          participantIds: [parent.sub, klass.homeroomTeacherId],
        },
      });
    }
    await this.prisma.message.create({
      data: { threadId: thread.id, senderUserId: parent.sub, body: dto.body, templateKey: dto.templateKey ?? null },
    });
    return this.toThreadDto(thread);
  }

  /** POST /threads/:id/messages — peserta thread (ortu/wali kelas), bukan siswa. */
  async send(actor: JwtClaims, threadId: string, dto: SendMessageRequest): Promise<Message> {
    const thread = await this.requireParticipantThread(actor, threadId);
    if (actor.role === "STUDENT") {
      throw apiError("FORBIDDEN", "Siswa tidak boleh di kanal ortu–wali kelas.", HttpStatus.FORBIDDEN);
    }
    void thread;
    const msg = await this.prisma.message.create({
      data: { threadId, senderUserId: actor.sub, body: dto.body, templateKey: dto.templateKey ?? null },
    });
    return this.toMsgDto(msg);
  }

  /** GET /threads/:id/messages */
  async listMessages(actor: JwtClaims, threadId: string): Promise<Message[]> {
    await this.requireParticipantThread(actor, threadId);
    const msgs = await this.prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: "asc" },
      take: 500,
    });
    return msgs.map((m) => this.toMsgDto(m));
  }

  /** GET /threads — thread PARENT_HOMEROOM milik pemanggil (peserta). */
  async listThreads(actor: JwtClaims): Promise<Thread[]> {
    const threads = await this.prisma.thread.findMany({
      where: { type: "PARENT_HOMEROOM", participantIds: { has: actor.sub } },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });
    return threads.map((t) => this.toThreadDto(t));
  }

  /** Pastikan thread ada, tipe PARENT_HOMEROOM (Fase 2), & pemanggil peserta. */
  private async requireParticipantThread(
    actor: JwtClaims,
    threadId: string,
  ): Promise<{ id: string; type: string; participantIds: string[] }> {
    const thread = await this.prisma.thread.findUnique({ where: { id: threadId } });
    if (!thread) throw apiError("NOT_FOUND", "Thread tidak ditemukan.", HttpStatus.NOT_FOUND);
    if (thread.type !== "PARENT_HOMEROOM") {
      throw apiError("FORBIDDEN", "Tipe thread ini belum didukung (Fase 2 hanya PARENT_HOMEROOM).", HttpStatus.FORBIDDEN);
    }
    if (!thread.participantIds.includes(actor.sub)) {
      throw apiError("FORBIDDEN", "Anda bukan peserta thread ini.", HttpStatus.FORBIDDEN);
    }
    return thread;
  }

  private toThreadDto(t: {
    id: string;
    schoolId: string;
    type: string;
    contextId: string;
    participantIds: string[];
    createdAt: Date;
    updatedAt: Date;
  }): Thread {
    return {
      id: t.id,
      schoolId: t.schoolId,
      type: t.type as Thread["type"],
      contextId: t.contextId,
      participantIds: t.participantIds,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }

  private toMsgDto(m: {
    id: string;
    threadId: string;
    senderUserId: string;
    body: string;
    templateKey: string | null;
    createdAt: Date;
  }): Message {
    return {
      id: m.id,
      threadId: m.threadId,
      senderUserId: m.senderUserId,
      body: m.body,
      templateKey: m.templateKey,
      createdAt: m.createdAt.toISOString(),
    };
  }
}
