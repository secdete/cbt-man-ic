import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { extractTextFromPDF, parseQuestionsFromText } from '../lib/pdf-parser';

const prisma = new PrismaClient();

async function importPDF() {
  const filePathArg = process.argv[2];
  let targetFilePath = '';

  if (filePathArg) {
    targetFilePath = path.isAbsolute(filePathArg)
      ? filePathArg
      : path.join(process.cwd(), filePathArg);
  } else {
    // Cari file PDF di folder modul/
    const modulDir = path.join(process.cwd(), 'modul');
    if (fs.existsSync(modulDir)) {
      const files = fs.readdirSync(modulDir).filter((f) => f.toLowerCase().endsWith('.pdf'));
      if (files.length > 0) {
        targetFilePath = path.join(modulDir, files[0]);
      }
    }
  }

  if (!targetFilePath || !fs.existsSync(targetFilePath)) {
    console.error('❌ Berkas PDF tidak ditemukan!');
    console.log('📌 Cara penggunaan:');
    console.log('   1. Taruh file PDF Anda ke dalam folder: C:\\Startup\\cbt-man-ic\\modul\\');
    console.log('   2. Jalankan: npx tsx scripts/import-pdf.ts "nama-file.pdf"');
    process.exit(1);
  }

  const fileName = path.basename(targetFilePath, path.extname(targetFilePath));
  console.log(`📄 Membaca berkas PDF: ${targetFilePath} (${(fs.statSync(targetFilePath).size / (1024 * 1024)).toFixed(2)} MB)...`);

  const fileBuffer = fs.readFileSync(targetFilePath);
  const rawText = await extractTextFromPDF(fileBuffer);
  console.log(`📝 Berhasil mengekstrak ${rawText.length} karakter teks dari PDF.`);

  const questions = parseQuestionsFromText(rawText);

  if (questions.length === 0) {
    console.warn('⚠️ Tidak ada format butir soal yang terdeteksi secara otomatis.');
    console.log('Menyimpan hasil ekstraksi teks ke modul/hasil-ekstraksi.txt agar bisa diperiksa...');
    fs.writeFileSync(path.join(process.cwd(), 'modul', `${fileName}-ekstrak.txt`), rawText, 'utf8');
    process.exit(1);
  }

  console.log(`🎯 Berhasil memetakan ${questions.length} butir soal!`);

  // Buat token unik
  const randomChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let token = 'IC';
  for (let i = 0; i < 4; i++) {
    token += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
  }

  const title = `Tryout MAN IC - ${fileName.replace(/[-_]/g, ' ')}`;

  console.log(`💾 Menyimpan ke database Supabase...`);
  console.log(`   - Judul: ${title}`);
  console.log(`   - Token: ${token}`);
  console.log(`   - Jumlah Soal: ${questions.length}`);

  const exam = await prisma.exam.create({
    data: {
      title,
      description: `Paket soal diimpor otomatis dari modul PDF: ${fileName}.pdf`,
      category: 'SNPDB MAN IC',
      durationMinutes: Math.max(60, Math.round(questions.length * 1.8)),
      token,
      passingScore: 65,
      isActive: true,
      questions: {
        create: questions.map((q) => ({
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          optionE: q.optionE || '',
          correctAnswer: q.correctAnswer || 'A',
          explanation: q.explanation || '',
          subject: q.subject || 'SNPDB MAN IC',
          points: q.points || 4,
        })),
      },
    },
  });

  console.log(`\n🎉 SUKSES BESAR!`);
  console.log(`Paket Tryout "${exam.title}" telah masuk ke Supabase!`);
  console.log(`🔑 Token Ujian: ${exam.token}`);
  console.log(`🌐 Langsung live di website: https://cbt-man-ic.vercel.app`);
}

importPDF()
  .catch((e) => {
    console.error('Terjadi kesalahan:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

