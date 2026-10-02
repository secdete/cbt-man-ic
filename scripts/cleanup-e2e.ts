import { prisma } from "../lib/prisma";

async function main() {
  const students = await prisma.student.findMany({
    select: { id: true, name: true, phone: true, school: true, createdAt: true },
  });
  console.log("Semua student:", students);

  const testStudents = students.filter(
    (s) =>
      (s.phone ?? "").startsWith("0819") ||
      /e2e|test|uji/i.test(s.name) ||
      /e2e|test|uji/i.test(s.school ?? "")
  );
  if (testStudents.length === 0) {
    console.log("Tidak ada student sisa dari e2e.");
    return;
  }

  for (const s of testStudents) {
    const sessions = await prisma.examSession.findMany({
      where: { studentId: s.id },
      select: { id: true },
    });
    const sessionIds = sessions.map((x) => x.id);
    if (sessionIds.length) {
      await prisma.answerSubmission.deleteMany({
        where: { sessionId: { in: sessionIds } },
      });
      await prisma.examSession.deleteMany({ where: { id: { in: sessionIds } } });
    }
    await prisma.student.delete({ where: { id: s.id } });
    console.log(`Dihapus: ${s.name} (${s.phone}), sesi=${sessionIds.length}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
