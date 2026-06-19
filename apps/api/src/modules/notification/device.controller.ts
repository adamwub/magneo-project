import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Post, UseGuards } from "@nestjs/common";
import { deviceRegisterRequestSchema, type DeviceRegisterRequest, type JwtClaims } from "@magnoo/shared";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { RolesGuard } from "../../common/rbac/roles.guard";
import { DeviceService } from "./device.service";

/**
 * Registrasi device push (BAGIAN 8.2 `/me/devices`, 12A.2).
 * Tanpa @Roles → semua user terautentikasi boleh mendaftarkan device-nya SENDIRI
 * (diikat `user.sub`). RolesGuard meloloskan endpoint tanpa role/scope (defense-in-depth auth).
 */
@Controller("me")
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeviceController {
  constructor(private readonly devices: DeviceService) {}

  @Post("devices")
  @HttpCode(HttpStatus.OK)
  register(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(deviceRegisterRequestSchema)) dto: DeviceRegisterRequest,
  ): Promise<{ registered: true }> {
    return this.devices.register(user.sub, dto);
  }

  @Delete("devices/:token")
  @HttpCode(HttpStatus.OK)
  remove(@CurrentUser() user: JwtClaims, @Param("token") token: string): Promise<{ removed: boolean }> {
    return this.devices.remove(user.sub, token);
  }
}
