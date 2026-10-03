import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { CERTIFICATE_SIGNATORIES } from "./certificate-signatories";

type ExamReportData = {
  session: {
    id: string;
    studentName: string;
    studentNisn?: string | null;
    studentSchool?: string | null;
    studentWhatsapp?: string | null;
    startTime: string;
    endTime?: string | null;
    status: string;
    totalScore: number;
    maxPossibleScore: number;
    passingScore: number;
    isPassed: boolean;
    accuracy: number;
    correctCount: number;
    incorrectCount: number;
    unansweredCount: number;
    certificateNumber?: string | null;
  };
  exam: { title: string; category: string };
  subjectBreakdown: Array<{ subject: string; total: number; correct: number; points: number; percentage: number }>;
  questions: Array<{ questionNumber: number; subject?: string | null; correctAnswer: string; studentAnswer: string | null; isCorrect: boolean }>;
};

function safePdfText(value: unknown) {
  return String(value ?? "-")
    .replace(/[\u2022\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/[^\x20-\xFF]/g, "?");
}

function downloadPdf(bytes: Uint8Array, filename: string) {
  const url = URL.createObjectURL(new Blob([bytes as BlobPart], { type: "application/pdf" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadExamAnalysisPdf(data: ExamReportData, token: string) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(0.12, 0.18, 0.27);
  const muted = rgb(0.35, 0.4, 0.47);
  const margin = 48;
  let page = pdf.addPage([595.28, 841.89]);
  let y = 790;

  const line = (value: unknown, size = 10, isBold = false, color = ink) => {
    const text = safePdfText(value);
    const activeFont = isBold ? bold : font;
    const words = text.split(/\s+/);
    let current = "";
    const lines: string[] = [];
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (activeFont.widthOfTextAtSize(candidate, size) > 595.28 - margin * 2 && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) lines.push(current);
    for (const row of lines) {
      if (y < 55) {
        page = pdf.addPage([595.28, 841.89]);
        y = 790;
      }
      page.drawText(row, { x: margin, y, size, font: activeFont, color });
      y -= size + 7;
    }
  };

  line("LAPORAN HASIL ANALISIS TRYOUT", 17, true);
  line(data.exam.title, 13, true);
  y -= 3;
  line(`Nama peserta: ${data.session.studentName}`);
  line(`No. HP: ${data.session.studentWhatsapp || data.session.studentNisn || "-"}`);
  line(`Sekolah: ${data.session.studentSchool || "-"}`);
  line(`Tanggal ujian: ${new Date(data.session.endTime || data.session.startTime).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}`);
  y -= 6;
  line("RINGKASAN NILAI", 12, true);
  line(`Skor: ${data.session.totalScore} / ${data.session.maxPossibleScore} | Akurasi: ${data.session.accuracy}%`);
  line(`Benar: ${data.session.correctCount} | Salah: ${data.session.incorrectCount} | Kosong: ${data.session.unansweredCount}`);
  line(`Status: ${data.session.isPassed ? "Memenuhi nilai ambang" : "Belum memenuhi nilai ambang"} (ambang ${data.session.passingScore})`);
  y -= 6;
  line("ANALISIS PER SUBTEST", 12, true);
  for (const item of data.subjectBreakdown) {
    line(`${item.subject}: ${item.correct}/${item.total} benar (${item.percentage}%), skor ${item.points}`);
  }
  y -= 6;
  line("RINCIAN JAWABAN", 12, true);
  for (const item of data.questions) {
    const status = item.isCorrect ? "Benar" : item.studentAnswer ? "Salah" : "Tidak dijawab";
    line(`No. ${item.questionNumber} - ${item.subject || "Umum"} - ${status}`, 9, true, muted);
    line(`Jawaban peserta: ${item.studentAnswer || "-"} | Kunci: ${item.correctAnswer}`, 9);
  }

  const fileTag = safePdfText(
    (data.session.studentWhatsapp || data.session.studentNisn || data.session.id).replace(/[^\w-]/g, ""),
  );
  downloadPdf(await pdf.save(), `analisis-${safePdfText(token)}-${fileTag}.pdf`);
}

export async function downloadExamCertificatePdf(data: ExamReportData) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([841.89, 595.28]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.08, 0.16, 0.28);
  const gold = rgb(0.72, 0.54, 0.2);
  const muted = rgb(0.42, 0.45, 0.5);
  const center = (text: string, y: number, size: number, font = regular, color = navy) => {
    const safe = safePdfText(text);
    const width = font.widthOfTextAtSize(safe, size);
    page.drawText(safe, { x: (841.89 - width) / 2, y, size, font, color });
  };
  const centerAt = (
    text: string,
    cx: number,
    y: number,
    size: number,
    font = regular,
    color = navy,
  ) => {
    const safe = safePdfText(text);
    const width = font.widthOfTextAtSize(safe, size);
    page.drawText(safe, { x: cx - width / 2, y, size, font, color });
  };

  page.drawRectangle({ x: 25, y: 25, width: 791.89, height: 545.28, borderColor: gold, borderWidth: 2 });
  page.drawRectangle({ x: 34, y: 34, width: 773.89, height: 527.28, borderColor: navy, borderWidth: 0.8 });
  center("SERTIFIKAT HASIL TRYOUT", 500, 24, bold);
  center("SNPDB MAN INSAN CENDEKIA", 466, 13, bold, gold);
  center("Diberikan kepada", 414, 12);
  center(data.session.studentName, 375, 27, bold);
  center(`No. HP ${data.session.studentWhatsapp || data.session.studentNisn || "-"} | ${data.session.studentSchool || "-"}`, 347, 11);
  center(`Atas partisipasi dalam ${data.exam.title}`, 308, 13);
  center(`Skor ${data.session.totalScore}/${data.session.maxPossibleScore} | Akurasi ${data.session.accuracy}%`, 278, 14, bold);
  center(data.session.isPassed ? "Memenuhi nilai ambang tryout" : "Telah menyelesaikan tryout", 252, 11);
  center(`Nomor sertifikat: ${data.session.certificateNumber || `CERT-${data.session.id.slice(-8).toUpperCase()}`}`, 198, 10);
  center(`Tanggal: ${new Date(data.session.endTime || data.session.startTime).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "long", year: "numeric" })}`, 178, 10);
  center("CBT Tryout MAN IC", 145, 12, bold);

  // Blok tanda tangan — nama disamakan dengan sertifikat di layar.
  const signBlock = (
    cx: number,
    signer: { role: string; name: string; meta: string | null },
  ) => {
    centerAt(signer.role, cx, 112, 9, regular, muted);
    centerAt(signer.name, cx, 78, 11, bold, navy);
    page.drawLine({
      start: { x: cx - 78, y: 70 },
      end: { x: cx + 78, y: 70 },
      thickness: 0.8,
      color: navy,
    });
    if (signer.meta) centerAt(signer.meta, cx, 56, 8, regular, muted);
  };
  signBlock(210, CERTIFICATE_SIGNATORIES.proctor);
  signBlock(632, CERTIFICATE_SIGNATORIES.headmaster);

  const fileTag = safePdfText(
    (data.session.studentWhatsapp || data.session.studentNisn || data.session.id).replace(/[^\w-]/g, ""),
  );
  downloadPdf(await pdf.save(), `sertifikat-${fileTag}.pdf`);
}
