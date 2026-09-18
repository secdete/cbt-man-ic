import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const exams = await prisma.exam.findMany({
    include: {
      questions: {
        take: 3,
        orderBy: { questionNumber: "asc" },
      },
    },
  });

  for (const e of exams) {
    console.log(`========================================`);
    console.log(
      `EXAM: ${e.title} (${e.token}) - Total: ${e.questions.length} samples shown`,
    );
    for (const q of e.questions) {
      console.log(`  Soal #${q.questionNumber}:`);
      console.log(`  Text: ${q.questionText.slice(0, 150)}...`);
      console.log(
        `  A: ${q.optionA.slice(0, 50)} | B: ${q.optionB.slice(0, 50)}`,
      );
      console.log(
        `  C: ${q.optionC.slice(0, 50)} | D: ${q.optionD.slice(0, 50)}`,
      );
      console.log(`  E: ${q.optionE?.slice(0, 50) || "-"}`);
    }
  }
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
