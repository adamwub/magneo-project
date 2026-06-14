import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./config/env";
import { PrismaModule } from "./prisma/prisma.module";
import { AuditModule } from "./common/audit/audit.module";
import { RbacModule } from "./common/rbac/rbac.module";
import { HealthModule } from "./health/health.module";

// Modul fitur (ADR-003 modular monolith) — stub di Fase 0c, diisi pada fasenya.
import { AuthModule } from "./modules/auth/auth.module";
import { SchoolModule } from "./modules/school/school.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { CommsModule } from "./modules/comms/comms.module";
import { AiModule } from "./modules/ai/ai.module";
import { GamificationModule } from "./modules/gamification/gamification.module";
import { AdsModule } from "./modules/ads/ads.module";
import { CareerModule } from "./modules/career/career.module";
import { SyncModule } from "./modules/sync/sync.module";
import { NotificationModule } from "./modules/notification/notification.module";
import { AnalyticsModule } from "./modules/analytics/analytics.module";
import { BillingModule } from "./modules/billing/billing.module";
import { FeatureFlagsModule } from "./modules/feature-flags/feature-flags.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    PrismaModule,
    AuditModule,
    RbacModule,
    HealthModule,
    // 13 modul fitur (kosong dulu):
    AuthModule,
    SchoolModule,
    AttendanceModule,
    CommsModule,
    AiModule,
    GamificationModule,
    AdsModule,
    CareerModule,
    SyncModule,
    NotificationModule,
    AnalyticsModule,
    BillingModule,
    FeatureFlagsModule,
  ],
})
export class AppModule {}
