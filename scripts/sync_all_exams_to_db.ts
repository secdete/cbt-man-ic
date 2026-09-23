import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log(
    "🚀 Memulai sinkronisasi seluruh 16 paket ujian dari JSON ke Supabase PostgreSQL...\n",
  );

  const jsonDir = path.join(process.cwd(), "scripts", "extracted_exams");
  const files = fs.readdirSync(jsonDir).filter((f) => f.endsWith(".json"));

  console.log(`Ditemukan ${files.length} file dataset JSON.\n`);

  let totalUpdatedQuestions = 0;
  let totalExamsProcessed = 0;

  for (const file of files) {
    const filePath = path.join(jsonDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    const cfg = data.config;
    const questions = data.questions;

    // 1. Cari exam berdasarkan token
    let exam = await prisma.exam.findUnique({
      where: { token: cfg.token },
    });

    if (!exam) {
      console.log(`Exam [${cfg.token}] belum ada, membuat baru...`);
      exam = await prisma.exam.create({
        data: {
          title: cfg.title,
          description: `Materi Ujian CBT Seleksi Nasional Peserta Didik Baru (SNPDB) MAN Insan Cendekia / MAN PK. Kategori: ${cfg.category}`,
          category: cfg.category,
          durationMinutes: cfg.duration,
          passingScore: cfg.passing_score,
          token: cfg.token,
          isActive: true,
        },
      });
    }

    // 2. Update atau create butir-butir soal
    for (const q of questions) {
      const existingQ = await prisma.question.findFirst({
        where: {
          examId: exam.id,
          questionNumber: q.questionNumber,
        },
      });

      if (existingQ) {
        await prisma.question.update({
          where: { id: existingQ.id },
          data: {
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            optionE: q.optionE || null,
            correctAnswer: q.correctAnswer || existingQ.correctAnswer || "A",
            subject: q.subject,
            points: q.points || 4,
          },
        });
      } else {
        await prisma.question.create({
          data: {
            examId: exam.id,
            questionNumber: q.questionNumber,
            questionText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            optionE: q.optionE || null,
            correctAnswer: q.correctAnswer || "A",
            subject: q.subject,
            points: q.points || 4,
          },
        });
      }
      totalUpdatedQuestions++;
    }

    totalExamsProcessed++;
    console.log(
      `✅ [${cfg.token}] ${cfg.title}: Berhasil sinkronisasi ${questions.length} butir soal.`,
    );
  }

  console.log("\n========================================================");
  console.log(
    `🎉 SUKSES BESAR: Total ${totalExamsProcessed} Paket Ujian & ${totalUpdatedQuestions} Butir Soal Terupdate Sempurna di Database!`,
  );
  console.log("========================================================\n");
}

main()
  .catch((err) => {
    console.error("Error syncing exams:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
