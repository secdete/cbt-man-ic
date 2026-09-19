import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clean() {
  const oldTokens = ["IC-MAT", "IC-SKOL", "IC-SIM1", "PK-SIM1"];
  for (const t of oldTokens) {
    const ex = await prisma.exam.findUnique({ where: { token: t } });
    if (ex) {
      await prisma.answerSubmission.deleteMany({
        where: { session: { examId: ex.id } },
      });
      await prisma.examSession.deleteMany({ where: { examId: ex.id } });
      await prisma.question.deleteMany({ where: { examId: ex.id } });
      await prisma.exam.delete({ where: { id: ex.id } });
      console.log("Deleted old duplicate exam token:", t);
    }
  }
}

clean()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

