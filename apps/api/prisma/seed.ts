/**
 * Seed script (Fase 0i) — fills the CLOUD database with demo data so later
 * phases have something to test against: 1 school, 1 class, 1 admin, 2 teachers,
 * 5 students, 2 parents (each linked to one student).
 *
 * PRIVACY (ADR-005 + Guardrail #13.2): students live in the cloud as UUID +
 * non-identifying attributes ONLY. No name (displayName = null), no contact.
 * Real student NIS/name belong in the school's Box, never here.
 *
 * Demo student logins use synthetic codes ("siswa-demo-N"), NOT real-looking
 * NIS, and intentionally do NOT bake in any NIS-pseudonymisation scheme — that
 * is a Fase 1 (auth/import) decision. See progress.md "Ide & Utang".
 *
 * Idempotent: every row is upserted by a fixed id, so re-running changes nothing.
 * Run: pnpm --filter @magnoo/api db:seed  (needs the dev stack up).
 */
import { PrismaClient, Role, UserStatus, SchoolStatus, LinkStatus } from "@prisma/client";
import { hash } from "@node-rs/argon2";
import { SCHOOL_SETTING_DEFAULTS } from "@magnoo/shared";

const prisma = new PrismaClient();

// Stable ids → deterministic, idempotent upserts.
const ID = {
  school: "11111111-1111-4111-8111-111111111111",
  klass: "22222222-2222-4222-8222-222222222222",
  admin: "33333333-3333-4333-8333-333333333333",
  teacher: ["44444444-4444-4444-8444-444444444441", "44444444-4444-4444-8444-444444444442"],
  student: [
    "55555555-5555-4555-8555-555555555551",
    "55555555-5555-4555-8555-555555555552",
    "55555555-5555-4555-8555-555555555553",
    "55555555-5555-4555-8555-555555555554",
    "55555555-5555-4555-8555-555555555555",
  ],
  parent: ["66666666-6666-4666-8666-666666666661", "66666666-6666-4666-8666-666666666662"],
  invite: ["77777777-7777-4777-8777-777777777771", "77777777-7777-4777-8777-777777777772"],
  parentLink: ["88888888-8888-4888-8888-888888888881", "88888888-8888-4888-8888-888888888882"],
} as const;

// Demo password — documented, not a secret (Guardrail #13.11: never plaintext in DB).
const DEMO_PASSWORD = "MagnooDemo#2026";

async function main(): Promise<void> {
  const passwordHash = await hash(DEMO_PASSWORD); // @node-rs/argon2 defaults to argon2id (BAGIAN 14)
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // 1) School
  await prisma.school.upsert({
    where: { id: ID.school },
    update: {},
    create: {
      id: ID.school,
      npsn: "99999999",
      name: "SMK Magnoo Demo",
      city: "Surabaya",
      province: "Jawa Timur",
      status: SchoolStatus.ACTIVE,
      settings: SCHOOL_SETTING_DEFAULTS,
    },
  });

  // 2) Adults (admin + teachers + parents) — name/contact allowed (ADR-005 exception).
  await prisma.user.upsert({
    where: { id: ID.admin },
    update: {},
    create: {
      id: ID.admin,
      schoolId: ID.school,
      role: Role.SCHOOL_ADMIN,
      username: "admin@magnoo.demo",
      passwordHash,
      status: UserStatus.ACTIVE,
      displayName: "Admin Sekolah Demo",
      email: "admin@magnoo.demo",
    },
  });

  for (let i = 0; i < ID.teacher.length; i++) {
    await prisma.user.upsert({
      where: { id: ID.teacher[i] },
      update: {},
      create: {
        id: ID.teacher[i],
        schoolId: ID.school,
        role: Role.TEACHER,
        username: `guru${i + 1}@magnoo.demo`,
        passwordHash,
        status: UserStatus.ACTIVE,
        displayName: `Guru Demo ${i + 1}`,
        email: `guru${i + 1}@magnoo.demo`,
      },
    });
  }

  for (let i = 0; i < ID.parent.length; i++) {
    await prisma.user.upsert({
      where: { id: ID.parent[i] },
      update: {},
      create: {
        id: ID.parent[i],
        schoolId: ID.school,
        role: Role.PARENT,
        username: `08120000000${i + 1}`,
        passwordHash,
        status: UserStatus.ACTIVE,
        displayName: `Orang Tua Demo ${i + 1}`,
        phone: `+628120000000${i + 1}`,
      },
    });
  }

  // 3) Class — homeroom = first teacher.
  await prisma.class.upsert({
    where: { id: ID.klass },
    update: {},
    create: {
      id: ID.klass,
      schoolId: ID.school,
      academicYear: "2026/2027",
      grade: 11,
      major: "TKJ",
      label: "XI-TKJ-1",
      homeroomTeacherId: ID.teacher[0],
    },
  });

  // 4) Students — UUID + role/class/status ONLY. No name, no contact (ADR-005).
  for (let i = 0; i < ID.student.length; i++) {
    await prisma.user.upsert({
      where: { id: ID.student[i] },
      update: {},
      create: {
        id: ID.student[i],
        schoolId: ID.school,
        role: Role.STUDENT,
        username: `siswa-demo-${i + 1}`, // synthetic, NOT a real NIS — see file header
        passwordHash,
        status: UserStatus.ACTIVE,
        displayName: null, // students never carry a name in the cloud
        classId: ID.klass,
        graduationYear: 2028,
      },
    });
  }

  // 5) Parent ↔ student links (need an InviteCode each; mark it used).
  for (let i = 0; i < ID.parent.length; i++) {
    await prisma.inviteCode.upsert({
      where: { id: ID.invite[i] },
      update: {},
      create: {
        id: ID.invite[i],
        code: `DEMOINV${i + 1}`,
        studentUserId: ID.student[i],
        expiresAt: in30Days,
        usedAt: now,
      },
    });

    await prisma.parentLink.upsert({
      where: { id: ID.parentLink[i] },
      update: {},
      create: {
        id: ID.parentLink[i],
        parentUserId: ID.parent[i],
        studentUserId: ID.student[i],
        inviteCodeId: ID.invite[i],
        status: LinkStatus.ACTIVE,
      },
    });
  }

  // Human-readable summary.
  const [schools, classes, admins, teachers, students, parents, links] = await Promise.all([
    prisma.school.count(),
    prisma.class.count(),
    prisma.user.count({ where: { role: Role.SCHOOL_ADMIN } }),
    prisma.user.count({ where: { role: Role.TEACHER } }),
    prisma.user.count({ where: { role: Role.STUDENT } }),
    prisma.user.count({ where: { role: Role.PARENT } }),
    prisma.parentLink.count(),
  ]);
  console.log("Seed OK:", { schools, classes, admins, teachers, students, parents, parentLinks: links });
  console.log(`Demo login password (all demo users): ${DEMO_PASSWORD}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed FAILED:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
