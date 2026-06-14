import { SetMetadata } from "@nestjs/common";

/** Tingkat scope resource (BAGIAN 7.3). */
export type ScopeLevel = "self" | "class" | "school" | "global";

/**
 * Dari mana RolesGuard mengambil id resource yang discope.
 * - `param`: nama route-param (mis. "id", "classId", "userId").
 * - `resource`: jenis resource agar resolver tahu cara cek kepemilikan.
 *   Untuk scope "school" boleh dikosongkan → guard memakai schoolId milik pemanggil
 *   (banyak endpoint admin beroperasi pada sekolahnya sendiri; filter data tetap
 *   ditegakkan di service per-endpoint).
 */
export interface ScopeOptions {
  param?: string;
  resource?: "user" | "class" | "school";
}

export const SCOPE_KEY = "rbac:scope";

export interface ScopeMeta {
  level: ScopeLevel;
  options: ScopeOptions;
}

/**
 * Tegakkan batas data sebuah endpoint (BAGIAN 7.3). Dicek RolesGuard:
 * pelanggaran → 403 + AuditLog. Contoh:
 *   `@Scope("self", { param: "id", resource: "user" })`
 *   `@Scope("class", { param: "classId", resource: "class" })`
 *   `@Scope("school")`  // sekolah milik pemanggil
 *   `@Scope("global")`  // hanya HQ
 */
export const Scope = (level: ScopeLevel, options: ScopeOptions = {}) =>
  SetMetadata(SCOPE_KEY, { level, options } satisfies ScopeMeta);
