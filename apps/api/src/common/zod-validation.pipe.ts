import { type PipeTransform, Injectable, HttpStatus } from "@nestjs/common";
import type { ZodTypeAny, infer as ZodInfer } from "zod";
import { apiError } from "./api-error";

/**
 * Pipe validasi body/param dengan skema zod (BAGIAN 17: validasi di tepi).
 * Pakai: `@Body(new ZodValidationPipe(loginRequestSchema)) dto: LoginRequest`.
 * Gagal validasi → 400 dengan kode VALIDATION_ERROR (format error BAGIAN 8.1).
 */
@Injectable()
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown): ZodInfer<T> {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const detail = result.error.issues
        .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
        .join("; ");
      throw apiError("VALIDATION_ERROR", detail, HttpStatus.BAD_REQUEST);
    }
    return result.data;
  }
}
