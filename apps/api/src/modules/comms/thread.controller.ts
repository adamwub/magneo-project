import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import {
  threadStartRequestSchema,
  sendMessageRequestSchema,
  type ThreadStartRequest,
  type SendMessageRequest,
  type Thread,
  type Message,
  type JwtClaims,
} from "@magnoo/shared";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { Roles } from "../../common/rbac/roles.decorator";
import { RolesGuard } from "../../common/rbac/roles.guard";
import { ThreadService } from "./thread.service";

/**
 * Pesan ortu↔wali kelas (BAGIAN 8.2 `/threads`, 10.7 / 12A.5).
 * @Roles tak menyertakan STUDENT (guardrail 13.5: tak ada siswa di kanal ini).
 */
@Controller("threads")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ThreadController {
  constructor(private readonly threads: ThreadService) {}

  /** POST /threads — ortu memulai thread dengan wali kelas anaknya. */
  @Post()
  @Roles("PARENT")
  start(
    @CurrentUser() user: JwtClaims,
    @Body(new ZodValidationPipe(threadStartRequestSchema)) dto: ThreadStartRequest,
  ): Promise<Thread> {
    return this.threads.start(user, dto);
  }

  /** GET /threads — daftar thread milik pemanggil. */
  @Get()
  @Roles("PARENT", "TEACHER")
  list(@CurrentUser() user: JwtClaims): Promise<Thread[]> {
    return this.threads.listThreads(user);
  }

  /** GET /threads/:id/messages */
  @Get(":id/messages")
  @Roles("PARENT", "TEACHER")
  messages(@CurrentUser() user: JwtClaims, @Param("id") id: string): Promise<Message[]> {
    return this.threads.listMessages(user, id);
  }

  /** POST /threads/:id/messages */
  @Post(":id/messages")
  @Roles("PARENT", "TEACHER")
  send(
    @CurrentUser() user: JwtClaims,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(sendMessageRequestSchema)) dto: SendMessageRequest,
  ): Promise<Message> {
    return this.threads.send(user, id, dto);
  }
}
