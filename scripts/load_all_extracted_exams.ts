import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Memulai import seluruh 16 paket ujian ke Supabase PostgreSQL...\n");

  const jsonDir = path.join(process.cwd(), "scripts", "extracted_exams");
  const files = fs.readdirSync(jsonDir).filter((f) => f.endsWith(".json"));

  console.log(`Ditemukan ${files.length} file paket ujian JSON.\n`);

  let totalExamsCreated = 0;
  let totalQuestionsCreated = 0;

  for (const file of files) {
    const filePath = path.join(jsonDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(content);

    const cfg = data.config;
    const questions = data.questions;

    // 1. Upsert Exam
    const exam = await prisma.exam.upsert({
      where: { token: cfg.token },
      update: {
        title: cfg.title,
        description: `Materi Ujian CBT Seleksi Nasional Peserta Didik Baru (SNPDB) MAN Insan Cendekia / MAN PK. Kategori: ${cfg.category}`,
        category: cfg.category,
        durationMinutes: cfg.duration,
        passingScore: cfg.passing_score,
        isActive: true,
      },
      create: {
        title: cfg.title,
        description: `Materi Ujian CBT Seleksi Nasional Peserta Didik Baru (SNPDB) MAN Insan Cendekia / MAN PK. Kategori: ${cfg.category}`,
        category: cfg.category,
        durationMinutes: cfg.duration,
        passingScore: cfg.passing_score,
        token: cfg.token,
        isActive: true,
      },
    });

    // 2. Hapus soal-soal lama untuk exam ini agar bersih
    await prisma.question.deleteMany({
      where: { examId: exam.id },
    });

    // 3. Masukkan soal baru dalam batch
    const questionData = questions.map((q: any) => ({
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
    }));

    await prisma.question.createMany({
      data: questionData,
    });

    totalExamsCreated += 1;
    totalQuestionsCreated += questionData.length;

    console.log(
      `✅ [${cfg.token}] ${cfg.title}: Berhasil memasukkan ${questionData.length} butir soal.`
    );
  }

  console.log("\n========================================================");
  console.log(
    `🎉 SUKSES BESAR: Total ${totalExamsCreated} Paket Ujian & ${totalQuestionsCreated} Butir Soal Telah Aktif di Supabase!`
  );
  console.log("========================================================\n");
}

main()
  .catch((err) => {
    console.error("Error loading exams:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
