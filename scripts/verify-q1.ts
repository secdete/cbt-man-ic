import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  const q = await prisma.question.findFirst({
    where: { exam: { token: "IC-AGAMA" }, questionNumber: 1 },
  });
  console.log("SOAL NO. 1 DI SUPABASE:");
  console.log(q?.questionText);
  console.log("\nOPSI A: " + q?.optionA);
  console.log("OPSI B: " + q?.optionB);
  console.log("OPSI C: " + q?.optionC);
  console.log("OPSI D: " + q?.optionD);
}

run().finally(() => prisma.$disconnect());
