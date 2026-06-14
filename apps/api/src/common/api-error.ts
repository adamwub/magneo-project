import { HttpException } from "@nestjs/common";
import { makeErrorResponse, type ErrorCode } from "@magnoo/shared";

/**
 * Lempar error API dengan bentuk respons standar (BAGIAN 8.1):
 *   { "error": { "code": "...", "message": "...", "traceId": "..." } }
 *
 * HttpException dengan body objek membuat Nest mengirim objek itu apa adanya,
 * sehingga seluruh endpoint memakai format error yang sama.
 */
export function apiError(
  code: ErrorCode,
  message: string,
  status: number,
): HttpException {
  return new HttpException(makeErrorResponse(code, message), status);
}
