import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const dummyQuestions = await prisma.question.findMany({
    where: {
      optionA: { contains: 'Pilihan A' },
    },
    include: { exam: true },
  });

  console.log(`Ditemukan ${dummyQuestions.length} butir soal dengan 'Pilihan A':`);
  
  const byExam = new Map<string, number>();
  dummyQuestions.forEach((q) => {
    byExam.set(q.exam.title, (byExam.get(q.exam.title) || 0) + 1);
  });

  byExam.forEach((count, title) => {
    console.log(`- ${title}: ${count} butir soal`);
  });

  console.log('\nContoh 5 Soal dengan "Pilihan A":');
  dummyQuestions.slice(0, 5).forEach((q, idx) => {
    console.log(`[Contoh ${idx + 1}] (${q.exam.title} - Soal #${q.questionNumber}):`);
    console.log(`Teks: ${q.questionText.slice(0, 200)}...`);
    console.log(`Opt A: ${q.optionA}`);
    console.log(`-----------------------------------`);
  });
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
