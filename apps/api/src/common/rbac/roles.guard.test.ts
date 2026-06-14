import { describe, it, expect, beforeEach, vi } from "vitest";
import { HttpException } from "@nestjs/common";
import { RolesGuard } from "./roles.guard";
import { ROLES_KEY } from "./roles.decorator";
import { SCOPE_KEY, type ScopeMeta } from "./scope.decorator";

function codeOf(err: unknown): string | undefined {
  if (err instanceof HttpException) {
    const body = err.getResponse() as { error?: { code?: string } };
    return body.error?.code;
  }
  return undefined;
}

function ctx(user: unknown) {
  const req = { user, ip: "1.2.3.4", method: "GET", url: "/x", originalUrl: "/x", params: {}, body: {} };
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => req }),
  } as never;
}

let reflectorMeta: { roles?: unknown; scope?: ScopeMeta };
let reflector: any;
let scopeService: any;
let audit: any;
let guard: RolesGuard;

beforeEach(() => {
  reflectorMeta = {};
  reflector = {
    getAllAndOverride: vi.fn((key: string) =>
      key === ROLES_KEY ? reflectorMeta.roles : key === SCOPE_KEY ? reflectorMeta.scope : undefined,
    ),
  };
  scopeService = { check: vi.fn() };
  audit = { write: vi.fn().mockResolvedValue(undefined) };
  guard = new RolesGuard(reflector, scopeService, audit);
});

const student = { sub: "u1", sid: "s1", role: "STUDENT", schoolId: "sc1", scopes: [], linkRoles: [] };
const admin = { ...student, sub: "a1", role: "SCHOOL_ADMIN" };

describe("RolesGuard", () => {
  it("tanpa @Roles & @Scope → lewat (autentikasi saja)", async () => {
    expect(await guard.canActivate(ctx(student))).toBe(true);
  });

  it("tanpa user (token tak ada) → UNAUTHORIZED", async () => {
    reflectorMeta.roles = ["SCHOOL_ADMIN"];
    const err = await guard.canActivate(ctx(undefined)).catch((e) => e);
    expect(codeOf(err)).toBe("UNAUTHORIZED");
  });

  it("peran tidak diizinkan → 403 FORBIDDEN + audit dicatat", async () => {
    reflectorMeta.roles = ["SCHOOL_ADMIN"];
    const err = await guard.canActivate(ctx(student)).catch((e) => e);
    expect(codeOf(err)).toBe("FORBIDDEN");
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({ action: "RBAC_DENY", actorUserId: "u1" }),
    );
  });

  it("peran cocok tanpa scope → lewat, tidak ada audit", async () => {
    reflectorMeta.roles = ["SCHOOL_ADMIN"];
    expect(await guard.canActivate(ctx(admin))).toBe(true);
    expect(audit.write).not.toHaveBeenCalled();
  });

  it("scope ditolak → 403 + audit (pakai entity/entityId dari ScopeService)", async () => {
    reflectorMeta.scope = { level: "school", options: {} };
    scopeService.check.mockResolvedValue({ allowed: false, entity: "school", entityId: "sc2" });
    const err = await guard.canActivate(ctx(admin)).catch((e) => e);
    expect(codeOf(err)).toBe("FORBIDDEN");
    expect(audit.write).toHaveBeenCalledWith(
      expect.objectContaining({ entity: "school", entityId: "sc2" }),
    );
  });

  it("scope diizinkan → lewat", async () => {
    reflectorMeta.scope = { level: "self", options: {} };
    scopeService.check.mockResolvedValue({ allowed: true, entity: "user", entityId: "u1" });
    expect(await guard.canActivate(ctx(student))).toBe(true);
    expect(audit.write).not.toHaveBeenCalled();
  });
});
