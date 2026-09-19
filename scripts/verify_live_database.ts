import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const exam = await prisma.exam.findUnique({
    where: { token: "SNPDB-2022-IPA" },
    include: { questions: { orderBy: { questionNumber: "asc" } } },
  });

  if (!exam) {
    console.error("Exam SNPDB-2022-IPA not found!");
    return;
  }

  console.log("=== VERIFYING SNPDB-2022-IPA IN DATABASE ===");
  for (const qnum of [3, 4, 7, 8, 10, 12, 13]) {
    const q = exam.questions.find((x) => x.questionNumber === qnum);
    if (!q) continue;
    console.log(`\n------------------ Q${qnum} ------------------`);
    console.log("Stem:\n" + q.questionText);
    console.log("Options:");
    console.log(`  (A) ${q.optionA}`);
    console.log(`  (B) ${q.optionB}`);
    console.log(`  (C) ${q.optionC}`);
    console.log(`  (D) ${q.optionD}`);
  }

  const arabExam = await prisma.exam.findUnique({
    where: { token: "IC-ARAB" },
    include: { questions: { orderBy: { questionNumber: "asc" } } },
  });

  if (arabExam) {
    console.log("\n=== VERIFYING BAHASA ARAB IN DATABASE ===");
    console.log(`Total questions: ${arabExam.questions.length}`);
    for (const q of arabExam.questions.slice(0, 4)) {
      console.log(`\nArab Q${q.questionNumber}:`);
      console.log("Stem: " + q.questionText);
      console.log(`  (A) ${q.optionA}`);
      console.log(`  (B) ${q.optionB}`);
      console.log(`  (C) ${q.optionC}`);
      console.log(`  (D) ${q.optionD}`);
    }
  }

  await prisma.$disconnect();
}

main().catch(console.error);
