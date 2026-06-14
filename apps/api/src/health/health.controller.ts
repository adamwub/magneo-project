import { Controller, Get } from "@nestjs/common";

/**
 * Healthcheck — dipakai infra (docker compose) dan ketiga klien (web/portal/HP)
 * untuk memastikan API hidup. Sengaja di luar prefix /api/v1 (lihat main.ts).
 */
@Controller("health")
export class HealthController {
  @Get()
  check(): { status: "ok"; service: string; ts: string } {
    return {
      status: "ok",
      service: "magnoo-api",
      ts: new Date().toISOString(),
    };
  }
}
