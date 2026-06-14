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
});
