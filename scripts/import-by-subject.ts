import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import {
  extractTextFromPDF,
  parseQuestionsFromText,
  ParsedQuestion,
} from "../lib/pdf-parser";

const prisma = new PrismaClient();

function sanitize(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/\0/g, "")
    .replace(/[\x00]/g, "")
    .trim();
}

// Prefix token per mata ujian
const subjectTokens: Record<string, string> = {
  "Penalaran Matematika": "IC-MTK",
  "Literasi Sains (IPA)": "IC-IPA",
  "Literasi Keagamaan Islam": "IC-AGM",
  "Literasi Bahasa Inggris": "IC-ENG",
  "Literasi Bahasa Indonesia": "IC-IND",
  "Penalaran Logika": "IC-LOG",
  "Tes Potensi Skolastik": "IC-TPS",
};

async function main() {
  console.log("🚀 Memulai Impor Modul MAN IC per Mata Ujian...");

  const pdfPath = path.join(process.cwd(), "modul", "Modul MAN IC.pdf");
  const cachePath = path.join(
    process.cwd(),
    "modul",
    "Modul-MAN-IC-extracted.txt",
  );

  let rawText = "";

  if (fs.existsSync(cachePath)) {
    console.log("⚡ Membaca teks hasil ekstraksi dari cache...");
    rawText = fs.readFileSync(cachePath, "utf8");
  } else if (fs.existsSync(pdfPath)) {
    console.log(
      `📄 Membaca berkas PDF: ${pdfPath} (${(fs.statSync(pdfPath).size / (1024 * 1024)).toFixed(2)} MB)...`,
    );
    const buffer = fs.readFileSync(pdfPath);
    rawText = await extractTextFromPDF(buffer);
    fs.writeFileSync(cachePath, rawText, "utf8");
    console.log("💾 Berhasil menyimpan teks ekstraksi ke cache.");
  } else {
    console.error("❌ Berkas PDF modul tidak ditemukan di folder modul/");
    process.exit(1);
  }

  // Bersihkan null bytes dari rawText
  rawText = sanitize(rawText);

  console.log("🔍 Memetakan butir-butir soal...");
  const allQuestions = parseQuestionsFromText(rawText);
  console.log(
    `🎯 Terdeteksi total ${allQuestions.length} butir soal dari modul.`,
  );

  // Kelompokkan per mata ujian / subtes
  const grouped = new Map<string, ParsedQuestion[]>();

  for (const q of allQuestions) {
    const subj = q.subject || "Tes Potensi Skolastik";
    if (!grouped.has(subj)) {
      grouped.set(subj, []);
    }
    grouped.get(subj)!.push(q);
  }

  console.log("\n📊 Ringkasan Pemisahan Mata Ujian:");
  grouped.forEach((list, subj) => {
    console.log(`   - ${subj}: ${list.length} butir soal`);
  });

  console.log("\n💾 Menyimpan paket ujian ke database Supabase...");

  const createdExams = [];

  for (const [subjectName, questions] of grouped.entries()) {
    const baseToken = subjectTokens[subjectName] || "IC-SUB";
    // Buat token unik jika perlu
    let finalToken = baseToken;
    let counter = 1;
    while (await prisma.exam.findUnique({ where: { token: finalToken } })) {
      finalToken = `${baseToken}${counter++}`;
    }

    const durationMinutes = Math.min(
      120,
      Math.max(45, Math.round(questions.length * 1.5)),
    );
    const title = `Tryout SNPDB MAN IC: ${subjectName}`;

    // Sanitasi semua butir soal dan re-index nomor soal dari 1 sampai N
    const sanitizedQuestions = questions.map((q, idx) => ({
      questionNumber: idx + 1,
      questionText: sanitize(q.questionText) || `Soal nomor ${idx + 1}`,
      optionA: sanitize(q.optionA) || "Opsi A",
      optionB: sanitize(q.optionB) || "Opsi B",
      optionC: sanitize(q.optionC) || "Opsi C",
      optionD: sanitize(q.optionD) || "Opsi D",
      optionE: sanitize(q.optionE) || "",
      correctAnswer: ["A", "B", "C", "D", "E"].includes(q.correctAnswer)
        ? q.correctAnswer
        : "A",
      explanation: sanitize(q.explanation) || "",
      subject: subjectName,
      points: 4,
    }));

    const exam = await prisma.exam.create({
      data: {
        title,
        description: `Simulasi Ujian Seleksi Nasional Peserta Didik Baru (SNPDB) Madrasah Aliyah Negeri Insan Cendekia - Subtes ${subjectName}. Berisi ${questions.length} butir soal.`,
        category: "SNPDB MAN IC",
        durationMinutes,
        token: finalToken,
        passingScore: 65,
        isActive: true,
        questions: {
          create: sanitizedQuestions,
        },
      },
    });

    createdExams.push({
      id: exam.id,
      title: exam.title,
      token: exam.token,
      subject: subjectName,
      totalQuestions: questions.length,
      durationMinutes,
    });

    console.log(
      `✅ [BERHASIL DIBUAT] ${exam.title} | Token: ${exam.token} | ${questions.length} Soal | Durasi: ${durationMinutes} Menit`,
    );
  }

  console.log("\n🎉 SEMUA MATA UJIAN TELAH BERHASIL DIBUAT DI SUPABASE!");
  console.log("Daftar Ujian Siap Dikerjakan:");
  console.table(
    createdExams.map((e) => ({
      Mata_Ujian: e.subject,
      Token: e.token,
      Jumlah_Soal: e.totalQuestions,
      Durasi_Menit: e.durationMinutes,
    })),
  );
  console.log("\n🌐 Buka langsung di website: https://cbt-man-ic.vercel.app");
}

main()
  .catch((err) => {
    console.error("❌ Gagal melakukan impor:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
