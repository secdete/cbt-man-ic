import { writeFileSync, mkdirSync } from "node:fs";
import { inflateSync } from "node:zlib";
import { PDFDocument } from "pdf-lib";
import { downloadExamAnalysisPdf, downloadExamCertificatePdf } from "../lib/exam-pdf";

// Shim browser agar modul PDF (client-side) bisa dijalankan di Node
let captured: any = null;
(globalThis as any).window = { setTimeout: () => 0, alert: () => {} };
(globalThis as any).document = { createElement: () => ({ href: "", download: "", click: () => {} }) };
(globalThis as any).URL.createObjectURL = (blob: Blob) => {
  captured = blob;
  return "blob:check";
};
(globalThis as any).URL.revokeObjectURL = () => {};

const SUBJECTS = [
  "Bahasa Indonesia",
  "Bahasa Arab",
  "Bahasa Inggris",
  "Matematika",
  "IPA (Sains Terpadu)",
  "IPS (Sosial Terpadu)",
  "Keislaman",
  "Kemampuan Analitik",
];

const questions = Array.from({ length: 123 }, (_, index) => {
  const options = ["A", "B", "C", "D", "E"];
  const correct = options[index % 5];
  const answered = index % 7 !== 0;
  return {
    questionNumber: index + 1,
    subject: SUBJECTS[index % SUBJECTS.length],
    correctAnswer: correct,
    studentAnswer: answered ? (index % 3 === 0 ? correct : options[(index + 2) % 5]) : null,
    isCorrect: answered && index % 3 === 0,
  };
});

const payload: any = {
  session: {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    studentName: "Muhammad Rizky Ananda Putra",
    studentNisn: null,
    studentSchool: "MTsN 1 Tangerang Selatan",
    studentWhatsapp: "6281234567890",
    startTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    endTime: new Date().toISOString(),
    status: "COMPLETED",
    totalScore: 356,
    maxPossibleScore: 492,
    passingScore: 70,
    isPassed: true,
    accuracy: 72.36,
    correctCount: 89,
    incorrectCount: 24,
    unansweredCount: 10,
    certificateNumber: "CERT-SNPDB/2026/ICPAKETUTUH-A1B2C3",
  },
  exam: { title: "Paket Try Out Utuh SNPDB MAN Insan Cendekia", category: "SNPDB 2023" },
  subjectBreakdown: SUBJECTS.map((subject, index) => ({
    subject,
    total: 15,
    correct: 10 + (index % 5),
    points: 40 + index,
    percentage: 70 + index,
  })),
  questions,
};

async function extractText(buffer: Buffer): Promise<string> {
  const raw = buffer.toString("latin1");
  const chunks: string[] = [];
  const streamPattern = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamPattern.exec(raw))) {
    const body = match[1];
    let content = body;
    if (!content.includes("Tj")) {
      try {
        content = inflateSync(Buffer.from(body, "latin1")).toString("latin1");
      } catch {
        continue;
      }
    }

    const textPattern = /(?:\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f]+>)\s*Tj/g;
    let textMatch: RegExpExecArray | null;
    while ((textMatch = textPattern.exec(content))) {
      const token = textMatch[0].replace(/\)\s*Tj$/, "").replace(/>\s*Tj$/, "");
      if (token.startsWith("<")) {
        const hex = token.slice(1);
        let decoded = "";
        for (let i = 0; i + 1 < hex.length; i += 2) {
          decoded += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
        }
        chunks.push(decoded);
        continue;
      }
      const inner = token.slice(1);
      chunks.push(
        inner
          .replace(/\\([()\\])/g, "$1")
          .replace(/\\(\d{1,3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8))),
      );
    }
  }

  return chunks.join(" ");
}

async function run() {
  mkdirSync("tmp-pdf-check", { recursive: true });

  await downloadExamCertificatePdf(payload);
  const certificateBlob = captured;
  captured = null;
  await downloadExamAnalysisPdf(payload, "IC-PAKET-UTUH");
  const analysisBlob = captured;

  if (!certificateBlob || !analysisBlob) throw new Error("Blob PDF tidak dibuat");

  const certBytes = Buffer.from(await (certificateBlob as Blob).arrayBuffer());
  const analysisBytes = Buffer.from(await (analysisBlob as Blob).arrayBuffer());
  writeFileSync("tmp-pdf-check/sertifikat.pdf", certBytes);
  writeFileSync("tmp-pdf-check/analisis.pdf", analysisBytes);

  const certDoc = await PDFDocument.load(certBytes);
  const analysisDoc = await PDFDocument.load(analysisBytes);
  const certText = await extractText(certBytes);
  const analysisText = await extractText(analysisBytes);
  const answerRows = (analysisText.match(/No\.\s+\d+/g) || []).length;

  const results: Array<[string, boolean, string]> = [
    ["Sertifikat berformat PDF", certBytes.subarray(0, 5).toString() === "%PDF-", `${certBytes.length} bytes`],
    ["Sertifikat 1 halaman A4 landscape", certDoc.getPageCount() === 1 && certDoc.getPage(0).getWidth() > certDoc.getPage(0).getHeight(), `${certDoc.getPageCount()} halaman`],
    ["Sertifikat memuat judul", certText.includes("SERTIFIKAT HASIL TRYOUT"), certText.slice(0, 60).replace(/\s+/g, " ")],
    ["Sertifikat memuat nama peserta", certText.includes("Muhammad Rizky Ananda Putra"), ""],
    ["Sertifikat memuat no. HP (bukan NISN kosong)", certText.includes("6281234567890"), ""],
    ["Sertifikat memuat nomor sertifikat", certText.includes("CERT-SNPDB/2026/ICPAKETUTUH-A1B2C3"), ""],
    ["Sertifikat memuat skor & akurasi", certText.includes("356/492") && certText.includes("72.36"), ""],
    ["Analisa berformat PDF", analysisBytes.subarray(0, 5).toString() === "%PDF-", `${analysisBytes.length} bytes`],
    ["Analisa memuat judul laporan", analysisText.includes("LAPORAN HASIL ANALISIS TRYOUT"), ""],
    ["Analisa memuat ringkasan nilai", analysisText.includes("RINGKASAN NILAI") && analysisText.includes("Benar: 89"), ""],
    ["Analisa memuat 8 seksi", SUBJECTS.every((subject) => analysisText.includes(subject)), `${SUBJECTS.length} seksi`],
    ["Analisa memuat seluruh 123 baris jawaban", answerRows >= 123, `${answerRows} baris`],
    ["Analisa multi-halaman", analysisDoc.getPageCount() >= 2, `${analysisDoc.getPageCount()} halaman`],
  ];

  let failed = 0;
  for (const [name, ok, detail] of results) {
    console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` (${detail})` : ""}`);
    if (!ok) failed += 1;
  }

  if (failed) {
    console.log(`\n${failed} pemeriksaan PDF gagal`);
    process.exit(1);
  }
  console.log(`\nSemua ${results.length} pemeriksaan PDF lulus (file di tmp-pdf-check/)`);
}

run().catch((error) => {
  console.error("PDF GAGAL DIBUAT:", error);
  process.exit(1);
});
