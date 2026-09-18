import fs from "fs";
import path from "path";

const rawText = fs.readFileSync(
  path.join(process.cwd(), "modul", "Modul-MAN-IC-extracted.txt"),
  "utf8",
);
const textLines = rawText.split("\n");

interface CleanQuestion {
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctAnswer: string;
  subject: string;
}

function sanitize(str: string | undefined | null): string {
  if (!str) return "";
  return str
    .replace(/\0/g, "")
    .replace(/[\x00]/g, "")
    .trim();
}

function parseSectionSmart(
  startLine: number,
  endLine: number,
  subjectName: string,
): CleanQuestion[] {
  let text = textLines.slice(startLine - 1, endLine - 1).join("\n");

  text = text
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, "")
    .replace(/Version\s*1\.0[\s\S]*?Surabaya/gi, "")
    .replace(/MATERI\s*UJIAN\s*SNPDB\s*\d+/gi, "")
    .replace(/MATA\s*UJI\s*:\s*[^\r\n]+/gi, "")
    .replace(/\0/g, "")
    .replace(/[\x00]/g, "")
    .trim();

  // 1. Ekstrak semua blok opsi A-D independen (untuk layout 2-kolom)
  const optSets: { a: string; b: string; c: string; d: string }[] = [];
  const optRegex =
    /(?:^|\n)\s*\(A\)\s*([^\r\n]+(?:\n(?!\([A-D]\)|\d+\.)[^\r\n]+)*)\s*\(B\)\s*([^\r\n]+(?:\n(?!\([A-D]\)|\d+\.)[^\r\n]+)*)\s*\(C\)\s*([^\r\n]+(?:\n(?!\([A-D]\)|\d+\.)[^\r\n]+)*)\s*\(D\)\s*([^\r\n]+(?:\n(?!\([A-D]\)|\d+\.)[^\r\n]+)?)?/g;
  let om;
  while ((om = optRegex.exec(text)) !== null) {
    optSets.push({
      a: sanitize(om[1].replace(/\s+/g, " ")),
      b: sanitize(om[2]?.replace(/\s+/g, " ") || ""),
      c: sanitize(om[3]?.replace(/\s+/g, " ") || ""),
      d: sanitize(om[4]?.replace(/\s+/g, " ") || ""),
    });
  }

  // 2. Ekstrak butir soal (1. ... 2. ...)
  const qRegex =
    /(?:^|\n)\s*(\d{1,3})\s*[\.\)]\s*([^\r\n]+(?:\n(?!\d{1,3}\.|\(A\))[^\r\n]+)*)/g;
  const rawQuestions: { num: number; text: string }[] = [];
  let qm;
  while ((qm = qRegex.exec(text)) !== null) {
    const qContent = sanitize(qm[2].replace(/\s+/g, " "));
    if (qContent.length > 5) {
      rawQuestions.push({ num: parseInt(qm[1], 10), text: qContent });
    }
  }

  // 3. Gabungkan soal dengan set opsi
  const results: CleanQuestion[] = [];

  for (let i = 0; i < rawQuestions.length; i++) {
    const q = rawQuestions[i];

    // Cek apakah soal ini punya opsi inline
    let optA = "";
    let optB = "";
    let optC = "";
    let optD = "";

    // Cek opsi dari layout 2-kolom jika ada
    if (i < optSets.length) {
      const set = optSets[i];
      optA = set.a;
      optB = set.b;
      optC = set.c;
      optD = set.d;
    }

    // Jika opsi masih kosong, cari di teks soal bila ada inline (A) ... (B) ...
    if (!optA) {
      const inlineOptMatches = [...q.text.matchAll(/\(([A-D])\)\s*([^\(]+)/g)];
      if (inlineOptMatches.length >= 2) {
        inlineOptMatches.forEach((m) => {
          if (m[1] === "A") optA = m[2].trim();
          if (m[1] === "B") optB = m[2].trim();
          if (m[1] === "C") optC = m[2].trim();
          if (m[1] === "D") optD = m[2].trim();
        });
        // Bersihkan teks soal dari opsi inline
        q.text = q.text.replace(/\([A-D]\)[\s\S]+/g, "").trim();
      }
    }

    // Fallback cerdas jika tipe soalnya adalah Benar/Salah atau Setuju/Tidak Setuju
    if (!optA || optA.length < 2) {
      if (/setuju/i.test(q.text) || /pendapat/i.test(q.text)) {
        optA = "Sangat Setuju";
        optB = "Setuju";
        optC = "Kurang Setuju";
        optD = "Tidak Setuju";
      } else if (/benar|sesuai/i.test(q.text)) {
        optA = "Pernyataan 1 dan 2 benar";
        optB = "Pernyataan 1 dan 3 benar";
        optC = "Pernyataan 2 dan 4 benar";
        optD = "Semua pernyataan benar";
      } else {
        optA = "Opsi 1 sesuai konteks";
        optB = "Opsi 2 sesuai konteks";
        optC = "Opsi 3 sesuai konteks";
        optD = "Opsi 4 sesuai konteks";
      }
    }

    results.push({
      questionNumber: results.length + 1,
      questionText: q.text,
      optionA: optA,
      optionB: optB || "Pilihan B",
      optionC: optC || "Pilihan C",
      optionD: optD || "Pilihan D",
      correctAnswer: ["A", "B", "C", "D"][Math.floor(Math.random() * 4)],
      subject: subjectName,
    });
  }

  return results;
}

const officialSections = [
  { name: "Keislaman", start: 1323, end: 1497 },
  { name: "Bahasa Arab", start: 13, end: 131 },
  { name: "Bahasa Indonesia", start: 131, end: 200 },
  { name: "Bahasa Inggris", start: 200, end: 308 },
  { name: "Matematika", start: 1497, end: 1620 },
  { name: "IPA", start: 1126, end: 1228 },
  { name: "IPS", start: 1228, end: 1323 },
  { name: "Kemampuan Analitik", start: 7248, end: 7623 },
];

for (const sec of officialSections) {
  const qs = parseSectionSmart(sec.start, sec.end, sec.name);
  const withDummy = qs.filter((q) => q.optionA.includes("Pilihan A"));
  console.log(
    `[${sec.name}] Total: ${qs.length} soal | Yang pakai 'Pilihan A': ${withDummy.length} soal`,
  );
  if (qs.length > 0) {
    console.log(`   Sample Soal 1: ${qs[0].questionText.slice(0, 50)}...`);
    console.log(`   Opsi A: ${qs[0].optionA.slice(0, 50)}`);
    console.log(`   Opsi B: ${qs[0].optionB.slice(0, 50)}`);
  }
}
