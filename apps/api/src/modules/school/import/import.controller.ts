import {
  Controller,
  Get,
  Header,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import type { ImportJobStatusResponse, ImportStartResponse, JwtClaims } from "@magnoo/shared";
import { apiError } from "../../../common/api-error";
import { JwtAuthGuard } from "../../auth/jwt-auth.guard";
import { CurrentUser } from "../../auth/current-user.decorator";
import { Roles } from "../../../common/rbac/roles.decorator";
import { Scope } from "../../../common/rbac/scope.decorator";
import { RolesGuard } from "../../../common/rbac/roles.guard";
import { ImportService } from "./import.service";

/** Batas ukuran unggahan (10 MB) — guard awal sebelum baca isi (lihat juga MAX_IMPORT_ROWS). */
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/**
 * Endpoint impor massal siswa (BAGIAN 8.2 /school/users/import).
 * Scope "school": admin hanya menyentuh sekolahnya (difilter di service).
 */
@Controller("school/users/import")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ImportController {
  constructor(private readonly importer: ImportService) {}

  /** POST /school/users/import (multipart, field "file") → { jobId }. */
  @Post()
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  @UseInterceptors(FileInterceptor("file", { limits: { fileSize: MAX_UPLOAD_BYTES } }))
  startImport(
    @CurrentUser() user: JwtClaims,
    @UploadedFile() file?: { buffer: Buffer; originalname: string },
  ): Promise<ImportStartResponse> {
    if (!file) {
      throw apiError("IMPORT_FILE_INVALID", "Tidak ada file yang diunggah (field 'file').", HttpStatus.BAD_REQUEST);
    }
    return this.importer.startImport(user.sub, this.schoolIdOf(user), file);
  }

  /** GET /school/users/import/:jobId → progres + tautan laporan. */
  @Get(":jobId")
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  getStatus(
    @CurrentUser() user: JwtClaims,
    @Param("jobId") jobId: string,
  ): Promise<ImportJobStatusResponse> {
    return this.importer.getStatus(this.schoolIdOf(user), jobId);
  }

  /** GET /school/users/import/:jobId/errors.csv → laporan error (unduh). */
  @Get(":jobId/errors.csv")
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="errors.csv"')
  readErrors(@CurrentUser() user: JwtClaims, @Param("jobId") jobId: string): Promise<string> {
    return this.importer.readErrorCsv(this.schoolIdOf(user), jobId);
  }

  /** GET /school/users/import/:jobId/credentials.csv → kredensial (sekali unduh). */
  @Get(":jobId/credentials.csv")
  @Roles("SCHOOL_ADMIN")
  @Scope("school")
  @Header("Content-Type", "text/csv; charset=utf-8")
  @Header("Content-Disposition", 'attachment; filename="credentials.csv"')
  readCredentials(
    @CurrentUser() user: JwtClaims,
    @Param("jobId") jobId: string,
  ): Promise<string> {
    return this.importer.readCredentialsCsvOnce(this.schoolIdOf(user), jobId);
  }

  private schoolIdOf(user: JwtClaims): string {
    if (!user.schoolId) {
      throw apiError("FORBIDDEN", "Akun ini tidak terikat sekolah.", HttpStatus.FORBIDDEN);
    }
    return user.schoolId;
  }
}
