/* eslint-disable no-console */
/**
 * Uji E2E Fase 1 (BAGIAN 12 DoD + QA gate 15: QA-1 auth, QA-2 impor).
 *
 * Skenario DoD: HQ buat sekolah → admin impor 500 siswa (ada baris rusak) →
 * siswa login → ortu register & link. Plus QA-1 (lockout, first-login, IDOR) &
 * QA-2 (campur valid/invalid, idempotent, file besar ditolak ramah).
 *
 * Prasyarat: backend hidup (default :3100) + Postgres/Redis dev. OTP dibaca dari
 * log server (pengirim WA masih stub). Konfigurasi:
 *   E2E_BASE     (default http://localhost:3100/api/v1)
 *   E2E_API_LOG  (default /tmp/api-3100.log)
 * Jalankan: pnpm --filter @magnoo/api test:e2e   (server harus sudah jalan)
 */
import { PrismaClient } from "@prisma/client";
import * as ExcelJS from "exceljs";
import { promises as fs } from "node:fs";
import { hashPassword } from "../../src/modules/auth/password";

const BASE = process.env.E2E_BASE ?? "http://localhost:3100/api/v1";
const LOG = process.env.E2E_API_LOG ?? "/tmp/api-3100.log";
const prisma = new PrismaClient();
let fails = 0;
let dev = 0;
const ok = (n: string, c: boolean, extra?: unknown) => {
  console.log(`${c ? "✅" : "❌"} ${n}${extra !== undefined ? "  " + JSON.stringify(extra) : ""}`);
  if (!c) fails++;
};
const J = (r: Response) => r.json() as Promise<any>;
const dn = () => `dev-${dev++}`;

async function lastOtp(id: string): Promise<string> {
  const log = await fs.readFile(LOG, "utf8");
  const lines = log.split("\n").filter((l) => l.includes(`→ ${id}: kode `));
  const m = lines[lines.length - 1]?.match(/kode (\d{6})/);
  if (!m) throw new Error(`OTP utk ${id} tak ditemukan di log ${LOG}`);
  return m[1];
}
async function login(body: Record<string, unknown>) {
  return J(await fetch(`${BASE}/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ deviceId: dn(), ...body }),
  }));
}
async function buildXlsx(rows: (string | number)[][]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("S");
  rows.forEach((r) => ws.addRow(r));
  return (await wb.xlsx.writeBuffer()) as unknown as Buffer;
}
async function uploadImport(token: string, buf: Buffer) {
  const fd = new FormData();
  fd.append("file", new Blob([buf]), "siswa.xlsx");
  const up = await J(await fetch(`${BASE}/school/users/import`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd }));
  for (let i = 0; i < 240; i++) {
    await new Promise((r) => setTimeout(r, 1000));
    const st = await J(await fetch(`${BASE}/school/users/import/${up.jobId}`, { headers: { Authorization: `Bearer ${token}` } }));
    if (st.status === "COMPLETED" || st.status === "FAILED") return { jobId: up.jobId, st };
  }
  throw new Error("impor tak selesai");
}

async function cleanup() {
  for (const npsn of ["90000001", "90000002"]) {
    const s = await prisma.school.findUnique({ where: { npsn } });
    if (!s) continue;
    const st = await prisma.user.findMany({ where: { schoolId: s.id, role: "STUDENT" }, select: { id: true } });
    await prisma.parentLink.deleteMany({ where: { studentUserId: { in: st.map((x) => x.id) } } });
    await prisma.inviteCode.deleteMany({ where: { studentUserId: { in: st.map((x) => x.id) } } });
    await prisma.consentRecord.deleteMany({ where: { subjectUserId: { in: st.map((x) => x.id) } } });
    await prisma.user.deleteMany({ where: { schoolId: s.id } });
    await prisma.device.deleteMany({ where: { schoolId: s.id } });
    await prisma.class.deleteMany({ where: { schoolId: s.id } });
    await prisma.importJob.deleteMany({ where: { schoolId: s.id } });
    await prisma.school.delete({ where: { id: s.id } });
  }
  await prisma.user.deleteMany({ where: { email: "e2e-hq@magnoo.test" } });
  await prisma.user.deleteMany({ where: { phone: "081299990001" } });
}

async function main() {
  await cleanup();
  // HQ user (tak ada API untuk membuat HQ).
  await prisma.user.create({ data: { role: "HQ_OPS", username: "e2e-hq@magnoo.test", email: "e2e-hq@magnoo.test", passwordHash: await hashPassword("HqE2E#2026"), status: "ACTIVE", mustChangePassword: false } });

  // ── DoD 1: HQ buat sekolah (+ pairing + akun admin) ──
  const hq = await login({ email: "e2e-hq@magnoo.test", password: "HqE2E#2026" });
  ok("HQ login", typeof hq.accessToken === "string");
  const HQ = { Authorization: `Bearer ${hq.accessToken}` };
  const schoolA = await J(await fetch(`${BASE}/hq/schools`, { method: "POST", headers: { ...HQ, "content-type": "application/json" }, body: JSON.stringify({ npsn: "90000001", name: "SMA E2E Fase1 A", city: "Surabaya", province: "Jawa Timur" }) }));
  ok("HQ buat sekolah A (ONBOARDING)", schoolA.status === "ONBOARDING", schoolA.status);
  await fetch(`${BASE}/hq/schools/${schoolA.id}/pair-box`, { method: "POST", headers: { ...HQ, "content-type": "application/json" }, body: JSON.stringify({ boxSerial: "BOX-E2E-A" }) });
  const adminCred = await J(await fetch(`${BASE}/hq/schools/${schoolA.id}/admin-account`, { method: "POST", headers: HQ }));
  ok("HQ terbitkan akun admin (username+tempPassword)", !!adminCred.username && !!adminCred.tempPassword);

  // ── QA-1: first-login admin (wajib ganti password) ──
  const adminFirst = await login({ username: adminCred.username, schoolId: schoolA.id, password: adminCred.tempPassword });
  ok("admin first-login: mustChangePassword=true", adminFirst.mustChangePassword === true);
  await fetch(`${BASE}/auth/password/change`, { method: "POST", headers: { Authorization: `Bearer ${adminFirst.accessToken}`, "content-type": "application/json" }, body: JSON.stringify({ oldPassword: adminCred.tempPassword, newPassword: "AdminBaru#2026" }) });
  const adminLogin = await login({ username: adminCred.username, schoolId: schoolA.id, password: "AdminBaru#2026" });
  ok("admin login dgn password baru", typeof adminLogin.accessToken === "string" && adminLogin.mustChangePassword === false);
  const ADM = { Authorization: `Bearer ${adminLogin.accessToken}` };

  // ── Admin buat 5 kelas ──
  const labels = ["X-IPA-1", "X-IPA-2", "X-IPA-3", "X-IPA-4", "X-IPA-5"];
  for (const label of labels) {
    await fetch(`${BASE}/school/classes`, { method: "POST", headers: { ...ADM, "content-type": "application/json" }, body: JSON.stringify({ academicYear: "2026/2027", grade: 10, label }) });
  }
  const classes = await J(await fetch(`${BASE}/school/classes`, { headers: ADM }));
  ok("5 kelas dibuat", Array.isArray(classes) && classes.length === 5, classes.length);

  // ── DoD 2 + QA-2: impor 500 siswa (campur valid/invalid) ──
  const rows: (string | number)[][] = [["NIS", "Nama", "Kelas"]];
  for (let i = 1; i <= 500; i++) rows.push([String(700000 + i), `Siswa ${i}`, labels[i % 5]]);
  rows.push(["", "NoNis", "X-IPA-1"]);          // NIS_REQUIRED
  rows.push(["abc", "BadNis", "X-IPA-1"]);       // NIS_INVALID
  rows.push(["700001", "Dup", "X-IPA-1"]);       // DUPLICATE_NIS_IN_FILE
  rows.push(["799001", "Ghost", "ZZZ-9"]);       // CLASS_NOT_FOUND
  rows.push(["799002", "", "X-IPA-1"]);          // NAME_REQUIRED
  const file = await buildXlsx(rows);
  const imp = await uploadImport(adminLogin.accessToken, file);
  ok("impor COMPLETED", imp.st.status === "COMPLETED", imp.st.status);
  ok("succeeded=500, created=500, failed=5", imp.st.succeeded === 500 && imp.st.created === 500 && imp.st.failed === 5, { s: imp.st.succeeded, c: imp.st.created, f: imp.st.failed });
  const studentCount = await prisma.user.count({ where: { schoolId: schoolA.id, role: "STUDENT", deletedAt: null } });
  ok("DB: 500 siswa", studentCount === 500, studentCount);

  // Unduh kredensial (sekali) → ambil 2 siswa untuk login & lockout.
  const credText = await (await fetch(`${BASE}/school/users/import/${imp.jobId}/credentials.csv`, { headers: ADM })).text();
  const credRows = credText.trim().split(/\r?\n/).slice(1).map((l) => l.split(","));
  ok("kredensial.csv berisi 500 baris", credRows.length === 500, credRows.length);
  const [nis1, pass1] = credRows[0];
  const [nis2] = credRows[1];

  // QA-2: idempotent (impor ulang → 0 baru).
  const imp2 = await uploadImport(adminLogin.accessToken, file);
  ok("idempotent: created=0, siswa tetap 500", imp2.st.created === 0 && (await prisma.user.count({ where: { schoolId: schoolA.id, role: "STUDENT", deletedAt: null } })) === 500, imp2.st.created);

  // QA-2: file terlalu besar → ditolak ramah (cap 3000).
  const bigRows: (string | number)[][] = [["NIS", "Nama", "Kelas"]];
  for (let i = 1; i <= 3500; i++) bigRows.push([String(800000 + i), `B${i}`, "X-IPA-1"]);
  const impBig = await uploadImport(adminLogin.accessToken, await buildXlsx(bigRows));
  ok("file >3000 baris → FAILED + pesan ramah", impBig.st.status === "FAILED" && typeof impBig.st.message === "string", impBig.st.message);

  // ── DoD 3: siswa login pakai NIS ASLI (uji sambungan pseudonim→login) ──
  const stu1First = await login({ username: nis1, schoolId: schoolA.id, password: pass1 });
  ok("siswa login dgn NIS asli berhasil (pseudonim tersambung)", typeof stu1First.accessToken === "string");
  ok("siswa first-login: mustChangePassword=true", stu1First.mustChangePassword === true);
  await fetch(`${BASE}/auth/password/change`, { method: "POST", headers: { Authorization: `Bearer ${stu1First.accessToken}`, "content-type": "application/json" }, body: JSON.stringify({ oldPassword: pass1, newPassword: "SiswaBaru#2026" }) });
  const stu1 = await login({ username: nis1, schoolId: schoolA.id, password: "SiswaBaru#2026" });
  ok("siswa login dgn password baru", typeof stu1.accessToken === "string");

  // ── QA-1: lockout 5× (siswa kedua, password salah) ──
  let locked = false;
  for (let i = 0; i < 6; i++) {
    const r = await fetch(`${BASE}/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username: nis2, schoolId: schoolA.id, password: "salahsalah", deviceId: dn() }) });
    if (r.status === 423) locked = true;
  }
  ok("lockout: setelah gagal beruntun → 423 ACCOUNT_LOCKED", locked);

  // ── QA-1: IDOR & RBAC ──
  const noToken = await fetch(`${BASE}/school/classes`, { headers: {} });
  ok("tanpa token → 401", noToken.status === 401, noToken.status);
  const wrongRole = await fetch(`${BASE}/school/classes`, { method: "POST", headers: { Authorization: `Bearer ${stu1.accessToken}`, "content-type": "application/json" }, body: JSON.stringify({ academicYear: "2026/2027", grade: 10, label: "X" }) });
  ok("siswa → buat kelas = 403 (RBAC)", wrongRole.status === 403, wrongRole.status);
  const hqToSchool = await fetch(`${BASE}/school/classes`, { headers: HQ });
  ok("HQ → endpoint sekolah = 403 (scope)", hqToSchool.status === 403, hqToSchool.status);
  // sekolah B + siswa B utk uji IDOR lintas sekolah
  const schoolB = await J(await fetch(`${BASE}/hq/schools`, { method: "POST", headers: { ...HQ, "content-type": "application/json" }, body: JSON.stringify({ npsn: "90000002", name: "SMA E2E Fase1 B", city: "Malang" }) }));
  const stuB = await prisma.user.create({ data: { schoolId: schoolB.id, role: "STUDENT", username: "stu-b-1", passwordHash: await hashPassword("xxxxxxxx"), status: "ACTIVE" } });
  const idor = await fetch(`${BASE}/school/consents`, { method: "POST", headers: { ...ADM, "content-type": "application/json" }, body: JSON.stringify({ subjectUserId: stuB.id, type: "GENERAL_DATA", docVersion: "v1" }) });
  ok("IDOR: admin A → siswa sekolah B = 404", idor.status === 404, idor.status);

  // ── DoD 4: ortu register & link anak ──
  const gen = await J(await fetch(`${BASE}/school/invite-codes/generate`, { method: "POST", headers: { ...ADM, "content-type": "application/json" }, body: JSON.stringify({ classId: classes[0].id }) }));
  ok("admin generate kode undangan", Array.isArray(gen.codes) && gen.codes.length > 0);
  const inviteCode = gen.codes[0].code;
  const phone = "081299990001";
  await fetch(`${BASE}/auth/parent/register`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone }) });
  const otp = await lastOtp(phone);
  const verify = await J(await fetch(`${BASE}/auth/parent/verify-otp`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ phone, otp }) }));
  ok("ortu verify-otp → tempToken", typeof verify.tempToken === "string");
  const linkResp = await fetch(`${BASE}/auth/parent/link-child`, { method: "POST", headers: { Authorization: `Bearer ${verify.tempToken}`, "content-type": "application/json" }, body: JSON.stringify({ inviteCode }) });
  const link = await linkResp.json();
  ok("ortu link anak → status ACTIVE", linkResp.ok && link.status === "ACTIVE", { status: linkResp.status });

  await cleanup();
  console.log(`\n${fails === 0 ? "🎉 SEMUA E2E FASE 1 LULUS (DoD + QA-1 + QA-2)" : `⚠️  ${fails} CEK GAGAL`}`);
  await prisma.$disconnect();
  process.exit(fails === 0 ? 0 : 1);
}

main().catch(async (e) => { console.error("FATAL", e); await prisma.$disconnect().catch(() => {}); process.exit(1); });
