import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const exams = await prisma.exam.findMany({
    select: {
      token: true,
      title: true,
      category: true,
      durationMinutes: true,
      _count: { select: { questions: true } }
    },
    orderBy: { createdAt: "asc" }
  });

  console.log("\n=======================================================");
  console.log("   STATUS LIVE 16 PAKET UJIAN DI DATABASE POSTGRESQL   ");
  console.log("=======================================================");
  exams.forEach((e, idx) => {
    const num = (idx + 1).toString().padStart(2, " ");
    const token = e.token.padEnd(18, " ");
    const qCount = `${e._count.questions} Soal`.padEnd(9, " ");
    const dur = `${e.durationMinutes}m`.padEnd(5, " ");
    const cat = e.category.padEnd(15, " ");
    console.log(`${num}. [${token}] ${qCount} (${dur}) | ${cat} | ${e.title}`);
  });

  // Verify Keislaman Q1
  const q1 = await prisma.question.findFirst({
    where: { exam: { token: "IC-AGAMA" }, questionNumber: 1 }
  });
  console.log("\n--- VERIFIKASI KEISLAMAN NO. 1 ---");
  console.log("Soal / Stimulus:", q1?.questionText?.slice(0, 120) + "...");
  console.log("Opsi A:", q1?.optionA);
  console.log("Opsi B:", q1?.optionB);

  // Verify Analitik Q1 & Q20
  const qa1 = await prisma.question.findFirst({
    where: { exam: { token: "IC-ANALITIK" }, questionNumber: 1 }
  });
  const qa20 = await prisma.question.findFirst({
    where: { exam: { token: "IC-ANALITIK" }, questionNumber: 20 }
  });
  console.log("\n--- VERIFIKASI KEMAMPUAN ANALITIK ---");
  console.log("Q1 Soal:", qa1?.questionText?.slice(0, 80));
  console.log("Q1 Opsi A:", qa1?.optionA);
  console.log("Q1 Opsi E:", qa1?.optionE);
  console.log("Q20 Soal:", qa20?.questionText?.slice(0, 80));
  console.log("Q20 Opsi E:", qa20?.optionE);
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
