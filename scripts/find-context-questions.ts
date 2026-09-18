import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const questions = await prisma.question.findMany({
    where: {
      OR: [
        { questionText: { contains: "di atas" } },
        { questionText: { contains: "bacaan" } },
        { questionText: { contains: "cerita" } },
        { questionText: { contains: "komik" } },
        { questionText: { contains: "paragraf" } },
      ],
    },
    include: { exam: true },
  });

  console.log(
    `Ditemukan ${questions.length} soal yang merujuk pada teks/wacana:`,
  );
  for (const q of questions.slice(0, 15)) {
    console.log(`[${q.exam.title} - Soal #${q.questionNumber}]`);
    console.log(`Teks: ${q.questionText}`);
    console.log("-----------------------------");
  }
}

run().finally(() => prisma.$disconnect());
