import { describe, it, expect } from "vitest";
import { ERROR_CODES, errorResponseSchema, makeErrorResponse } from "./errors.js";

describe("error codes", () => {
  it("setiap kunci sama dengan nilainya (konsisten)", () => {
    for (const [k, v] of Object.entries(ERROR_CODES)) {
      expect(k).toBe(v);
    }
  });

  it("makeErrorResponse menghasilkan bentuk yang valid", () => {
    const res = makeErrorResponse("FORBIDDEN", "Tidak diizinkan", "trace-1");
    expect(errorResponseSchema.safeParse(res).success).toBe(true);
    expect(res.error.code).toBe("FORBIDDEN");
  });

  it("errorResponseSchema menolak kode tak dikenal", () => {
    const bad = { error: { code: "NOPE", message: "x" } };
    expect(errorResponseSchema.safeParse(bad).success).toBe(false);
  });

  it("memuat 7 kode error Fase 2 (12A.5)", () => {
    const fase2 = [
      "ATTENDANCE_INVALID_TOKEN",
      "ATTENDANCE_OUT_OF_AREA",
      "ATTENDANCE_LOCATION_REQUIRED",
      "PERMIT_DUPLICATE",
      "PERMIT_INVALID_TRANSITION",
      "ANNOUNCEMENT_RETRACT_EXPIRED",
      "ANNOUNCEMENT_SCOPE_FORBIDDEN",
    ] as const;
    for (const code of fase2) {
      expect(ERROR_CODES[code]).toBe(code);
      expect(errorResponseSchema.safeParse(makeErrorResponse(code, "x")).success).toBe(true);
    }
  });
});
