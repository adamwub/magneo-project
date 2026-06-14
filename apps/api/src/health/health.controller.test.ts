import { describe, it, expect } from "vitest";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("mengembalikan status ok", () => {
    const res = new HealthController().check();
    expect(res.status).toBe("ok");
    expect(res.service).toBe("magnoo-api");
    expect(() => new Date(res.ts)).not.toThrow();
  });
});
