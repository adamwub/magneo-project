import { Injectable } from "@nestjs/common";
import type { Request } from "express";
import type { JwtClaims, Role } from "@magnoo/shared";
import { PrismaService } from "../../prisma/prisma.service";
import type { ScopeMeta } from "./scope.decorator";

export interface ScopeCheckResult {
  allowed: boolean;
  /** Untuk konteks AuditLog saat pelanggaran. */
  entity: string;
  entityId: string;
}

const HQ_ROLES: Role[] = ["HQ_ADMIN", "HQ_OPS"];
const SCHOOL_WIDE_ROLES: Role[] = ["SCHOOL_ADMIN", "PRINCIPAL"];

/**
 * Resolusi & pengecekan scope resource (BAGIAN 7.3).
 *
 * Catatan keterbatasan (utang): "guru pengampu" selain wali kelas belum bisa dicek
 * karena skema BAGIAN 6 hanya punya `Class.homeroomTeacherId` (tak ada tabel pengampu).
 * Untuk sekarang scope "class" bagi guru = wali kelas saja. Admin/kepsek lulus untuk
 * kelas mana pun di sekolahnya.
 */
@Injectable()
export class ScopeService {
  constructor(private readonly prisma: PrismaService) {}

  async check(meta: ScopeMeta, req: Request, user: JwtClaims): Promise<ScopeCheckResult> {
    switch (meta.level) {
      case "global":
        return { allowed: HQ_ROLES.includes(user.role), entity: "global", entityId: "*" };
      case "self":
        return this.checkSelf(meta, req, user);
      case "school":
        return this.checkSchool(meta, req, user);
      case "class":
        return this.checkClass(meta, req, user);
      default:
        return { allowed: false, entity: "unknown", entityId: "*" };
    }
  }

  private extractId(meta: ScopeMeta, req: Request, fallbackParam: string): string | undefined {
    const name = meta.options.param ?? fallbackParam;
    const params = req.params as Record<string, string | undefined>;
    const body = (req.body ?? {}) as Record<string, unknown>;
    const fromParam = params[name];
    if (typeof fromParam === "string" && fromParam.length > 0) return fromParam;
    const fromBody = body[name];
    return typeof fromBody === "string" && fromBody.length > 0 ? fromBody : undefined;
  }

  private async checkSelf(meta: ScopeMeta, req: Request, user: JwtClaims): Promise<ScopeCheckResult> {
    const targetId = this.extractId(meta, req, "id");
    // Tanpa id target = beroperasi pada diri sendiri (mis. /me).
    if (!targetId) return { allowed: true, entity: "user", entityId: user.sub };
    if (targetId === user.sub) return { allowed: true, entity: "user", entityId: targetId };
    // Ortu boleh mengakses anak yang tertaut aktif (matriks: Ortu ✅anak).
    if (user.role === "PARENT") {
      const link = await this.prisma.parentLink.findFirst({
        where: { parentUserId: user.sub, studentUserId: targetId, status: "ACTIVE" },
      });
      if (link) return { allowed: true, entity: "user", entityId: targetId };
    }
    return { allowed: false, entity: "user", entityId: targetId };
  }

  private async checkSchool(meta: ScopeMeta, req: Request, user: JwtClaims): Promise<ScopeCheckResult> {
    const targetSchoolId = await this.resolveSchoolId(meta, req);
    // Tanpa target eksplisit = sekolah milik pemanggil (filter data di service).
    if (!targetSchoolId) {
      return { allowed: user.schoolId != null, entity: "school", entityId: user.schoolId ?? "*" };
    }
    return {
      allowed: user.schoolId === targetSchoolId,
      entity: "school",
      entityId: targetSchoolId,
    };
  }

  /** Untuk scope "school": id bisa berupa schoolId langsung, atau id user/class yang perlu di-resolve. */
  private async resolveSchoolId(meta: ScopeMeta, req: Request): Promise<string | undefined> {
    const resource = meta.options.resource;
    if (resource === "user") {
      const id = this.extractId(meta, req, "id");
      if (!id) return undefined;
      const u = await this.prisma.user.findUnique({ where: { id }, select: { schoolId: true } });
      return u?.schoolId ?? undefined;
    }
    if (resource === "class") {
      const id = this.extractId(meta, req, "id");
      if (!id) return undefined;
      const c = await this.prisma.class.findUnique({ where: { id }, select: { schoolId: true } });
      return c?.schoolId ?? undefined;
    }
    return this.extractId(meta, req, "schoolId");
  }

  private async checkClass(meta: ScopeMeta, req: Request, user: JwtClaims): Promise<ScopeCheckResult> {
    const classId =
      meta.options.resource === "user"
        ? await this.classIdOfUser(this.extractId(meta, req, "id"))
        : this.extractId(meta, req, "classId");
    if (!classId) return { allowed: false, entity: "class", entityId: "*" };

    const klass = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { schoolId: true, homeroomTeacherId: true },
    });
    if (!klass || klass.schoolId !== user.schoolId) {
      return { allowed: false, entity: "class", entityId: classId };
    }
    // Admin/kepsek: kelas mana pun di sekolahnya. Guru: hanya kelas yang ia ampu (wali).
    if (SCHOOL_WIDE_ROLES.includes(user.role)) {
      return { allowed: true, entity: "class", entityId: classId };
    }
    if (user.role === "TEACHER") {
      return { allowed: klass.homeroomTeacherId === user.sub, entity: "class", entityId: classId };
    }
    return { allowed: false, entity: "class", entityId: classId };
  }

  private async classIdOfUser(userId: string | undefined): Promise<string | undefined> {
    if (!userId) return undefined;
    const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { classId: true } });
    return u?.classId ?? undefined;
  }
}
