import { SetMetadata } from "@nestjs/common";
import type { Role } from "@magnoo/shared";

/** Kunci metadata peran (dibaca RolesGuard). */
export const ROLES_KEY = "rbac:roles";

/**
 * Batasi endpoint ke daftar peran tertentu (BAGIAN 7.3).
 * Contoh: `@Roles("SCHOOL_ADMIN")` atau `@Roles("TEACHER", "SCHOOL_ADMIN")`.
 * Tanpa decorator ini, RolesGuard tidak memeriksa peran (hanya scope bila ada).
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
