/**
 * Verifikasi paket MAN IC hasil scripts/build-manic.ts langsung dari database:
 * jumlah soal, nomor urut, opsi, teks kunci, gambar — plus audit kunci jawaban
 * dengan membaca ulang PDF sumber dan mencocokkan nomor asli tiap butir.
 * Jalankan: npx tsx scripts/verify-manic.ts
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { extractStructuredFromPDF } from "../lib/pdf-extract";

const prisma = new PrismaClient();

const DUMMY = /^(pilihan|opsi)\s*[a-e]$/i;
const KEY_TEXT = /kunci\s*jawaban|answer\s*key/i;
const IMG = /!\[[^\]]*\]\([^)]*\)/g;
const IMG_TEST = /!\[[^\]]*\]\([^)]*\)/;
const KEY_HEADER_RE = /^\s*(KUNCI\s+JAWABAN|ANSWER\s+KEY)\b/i;
const NOTE_LINE_RE = /^(catatan|note|question\s+answer|no\.?\s+jawaban)\b/i;
const KEY_PAIR_RE =
  /(?:^|[^\d])(\d{1,3})(?:[.:\-)]\s*|\s+)([A-Ea-e](?:\s*(?:dan|,|&|\/|\+)\s*[A-Ea-e])*)(?=\s|$)/gi;
/** Baris kunci soal penyandingan ("3 1-b, 2-c, 3-d, 4-a") — bukan kunci biasa. */
const PAIRING_KEY_RE = /\d+\s*[-–]\s*[A-Da-d]/g;
const OPTION_LINE_RE = /^\s*(\()?([A-Ea-e])\s*([.)])\s*/;

const SOURCES: Record<string, string> = {
  "TPB: Verbal": "modul/MANIC/TPB/Soal_Verbal_20Soal.pdf",
  "TPB: Numerik": "modul/MANIC/TPB/Soal_Numerik_15Soal.pdf",
  "TPB: Analitik": "modul/MANIC/TPB/Soal_Analitik_15Soal.pdf",
  "TPB: Keislaman": "modul/MANIC/TPB/Soal_Tes_Keislaman_25.pdf",
  "Akademik: Bahasa Arab": "modul/MANIC/Akademik/Soal_Bahasa_Arab_25.pdf",
  "Akademik: Bahasa Indonesia": "modul/MANIC/Akademik/Soal_Bahasa_Indonesia_25 (1).pdf",
  "Akademik: Bahasa Inggris": "modul/MANIC/Akademik/Soal_Bahasa_Inggris_25_Soal.pdf",
  "Akademik: IPA": "modul/MANIC/Akademik/Soal_IPA_25_Soal.pdf",
  "Akademik: Matematika": "modul/MANIC/Akademik/Soal_Matematika_25_Soal.pdf",
  "Akademik: Keislaman": "modul/MANIC/Akademik/Soal_Tes_Keislaman_25.pdf",
};

const norm = (s: string) => s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

function toLines(raw: string): string[] {
  return raw
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .split("\n")
    .map((l) => l.replace(/[  ]+/g, " ").trim());
}

/** Kunci jawaban PDF: nomor -> huruf. Urutan pertama menang. */
function parseKeys(lines: string[]): Map<number, string> {
  const keys = new Map<number, string>();
  for (const line of lines) {
    if (NOTE_LINE_RE.test(line)) continue;
    if ((line.match(PAIRING_KEY_RE) || []).length >= 2) continue;
    KEY_PAIR_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = KEY_PAIR_RE.exec(line)) !== null) {
      const num = parseInt(m[1], 10);
      const letters = m[2]
        .toUpperCase()
        .split(/[^A-E]+/)
        .filter((s) => s.length === 1);
      if (!num || !letters.length || keys.has(num)) continue;
      keys.set(num, letters.join(","));
    }
  }
  return keys;
}

/** Nomor asli yang tertulis di awal badan soal. */
function stemNumber(questionText: string): number | null {
  const m = questionText.match(/(?:^|\n)\s*(?:soal\s*)?(\d{1,3})[.):]\s*(?=[^\s])/);
  return m ? parseInt(m[1], 10) : null;
}

/**
 * Untuk soal yang nomornya dipotong parser, cari nomornya kembali di PDF:
 * susun ulang badan PDF jadi satu teks, cari awal isi soal tersimpan, lalu naik
 * dari posisi itu sampai menemukan baris bernomor.
 */
type Loc = { idx: number; numIdx: number; num: number };

/**
 * Semua posisi di badan PDF yang memuat isi soal tersimpan. Pola soal bisa
 * sama antar butir (mis. "Simpulan teks tersebut adalah ...."), jadi tidak boleh
 * berhenti pada kecocokan pertama — kandidatnya dinilai dari opsi A–D-nya.
 */
function locateAll(bodyLines: string[], questionText: string): Loc[] {
  const target = norm(questionText.replace(IMG, ""));
  if (target.length < 15) return [];

  const normLines = bodyLines.map((l) => norm(l));
  const joined = normLines.join(" ");
  const offsetOf: number[] = [];
  let acc = 0;
  for (const n of normLines) {
    offsetOf.push(acc);
    acc += n.length + 1;
  }
  const lineAt = (pos: number) => {
    for (let i = 0; i < normLines.length; i++) {
      if (offsetOf[i] <= pos && pos <= offsetOf[i] + normLines[i].length) return i;
    }
    return -1;
  };

  const lens = [90, 70, 50, 35].filter((l) => l <= target.length);
  if (!lens.length) lens.push(target.length);

  const hasil: Loc[] = [];
  for (const panjang of lens) {
    const t = target.slice(0, panjang);
    let pos = joined.indexOf(t);
    while (pos >= 0) {
      const idx = lineAt(pos);
      if (idx >= 0) {
        const numIdx = findBackNumber(bodyLines, idx);
        const m = numIdx >= 0 ? bodyLines[numIdx].match(/^\s*(\d{1,3})[.)]/) : null;
        if (m && !hasil.some((h) => h.numIdx === numIdx)) {
          hasil.push({ idx, numIdx, num: parseInt(m[1], 10) });
        }
      }
      pos = joined.indexOf(t, pos + 1);
    }
    if (hasil.length) break;
  }
  return hasil;
}

/** Baris nomor soal terakhir sebelum baris `idx`. */
function findBackNumber(bodyLines: string[], idx: number): number {
  for (let j = idx; j >= 0; j--) {
    if (/^\s*\d{1,3}[.)]\s/.test(bodyLines[j])) return j;
  }
  return -1;
}

/** Baris nomor soal `num` terdekat dari posisi `from`. */
function findNumberLine(bodyLines: string[], num: number, from: number): number {
  const re = new RegExp(`^\\s*${num}[.)]\\s`);
  const batas = Math.min(bodyLines.length, from + 80);
  for (let i = from; i < batas; i++) if (re.test(bodyLines[i])) return i;
  for (let i = from; i >= 0; i--) if (re.test(bodyLines[i])) return i;
  return -1;
}

/** Opsi A–D yang tertulis di PDF tepat setelah baris nomor soal. */
function readOptions(bodyLines: string[], numIdx: number): Map<string, string> {
  const mNomor = bodyLines[numIdx]?.match(/^\s*(\d{1,3})[.)]/);
  const nomor = mNomor ? parseInt(mNomor[1], 10) : -1;
  const out = new Map<string, string>();
  for (let i = numIdx + 1; i < bodyLines.length; i++) {
    const l = bodyLines[i];
    const mNo = l.match(/^\s*(\d{1,3})[.)]\s/);
    if (mNo) {
      // Naskah ada yang mencetak nomor soal dua kali; itu masih soal yang sama.
      if (parseInt(mNo[1], 10) !== nomor) break;
      continue;
    }
    const m = l.match(/^\s*\(?([A-Ea-e])\)?[.)]\s*(.+)/);
    if (!m) continue;
    const huruf = m[1].toUpperCase();
    if (!out.has(huruf)) out.set(huruf, norm(m[2]));
  }
  return out;
}

/** Berapa banyak opsi tersimpan yang cocok dengan opsi PDF pada baris nomor itu. */
function skorOpsi(bodyLines: string[], numIdx: number, q: QuestionRow): number {
  const pdfOpts = readOptions(bodyLines, numIdx);
  const simpanan: Record<string, string> = {
    A: q.optionA,
    B: q.optionB,
    C: q.optionC,
    D: q.optionD,
  };
  let skor = 0;
  for (const huruf of ["A", "B", "C", "D"]) {
    const stored = norm(simpanan[huruf] || "").slice(0, 45);
    if (!stored) continue;
    const pdf = pdfOpts.get(huruf);
    if (pdf && (pdf.includes(stored) || stored.includes(pdf))) skor++;
  }
  return skor;
}

type QuestionRow = {
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  subject: string | null;
};

/** Baca ulang PDF sumber, cocokkan nomor asli tiap butir dengan kunci tersimpan. */
async function auditKeys(
  token: string,
  questions: QuestionRow[],
  problems: string[],
): Promise<{ cocok: number; gagal: number; tanpaNomor: number; bedaNomor: number }> {
  let cocok = 0;
  let gagal = 0;
  let tanpaNomor = 0;
  let bedaNomor = 0;

  const perSubject = new Map<string, QuestionRow[]>();
  for (const q of questions) {
    const s = q.subject || "(tanpa)";
    if (!perSubject.has(s)) perSubject.set(s, []);
    perSubject.get(s)!.push(q);
  }

  for (const [subject, qs] of perSubject) {
    const pdf = SOURCES[subject];
    if (!pdf) {
      problems.push(`${token}: sumber PDF untuk seksi "${subject}" tidak dikenal`);
      gagal += qs.length;
      continue;
    }
    const ext = await extractStructuredFromPDF(fs.readFileSync(path.join(process.cwd(), pdf)));
    const lines = toLines(ext.text);
    const keyStart = lines.findIndex((l) => KEY_HEADER_RE.test(l));
    const keys = parseKeys(lines.slice(keyStart));
    const body = lines.slice(0, keyStart < 0 ? lines.length : keyStart);

    // Kop = baris sebelum soal pertama (judul naskah, petunjuk, halaman).
    // Judul halaman yang diulang berulang kali di badan; baris isi biasa hanya
    // sekali muncul — jadi keduanya dibedakan dari jumlah kemunculannya.
    const kopParts: string[] = [];
    for (const l of body) {
      const t = l.trim();
      if (!t) continue;
      if (/^\d{1,3}[.)]/.test(t) || OPTION_LINE_RE.test(t)) break;
      kopParts.push(t);
    }
    const kop = norm(kopParts.join(" "));
    const kemunculan = new Map<string, number>();
    for (const l of body) {
      const n = norm(l);
      if (n.length < 10 || OPTION_LINE_RE.test(l) || /^\d{1,3}[.)]/.test(l)) continue;
      kemunculan.set(n, (kemunculan.get(n) || 0) + 1);
    }

    for (const q of qs) {
      for (const isi of [q.questionText, q.optionA, q.optionB, q.optionC, q.optionD]) {
        for (const baris of isi.replace(IMG, "").split("\n")) {
          const n = norm(baris);
          if (n.length < 10 || !kop.includes(n) || (kemunculan.get(n) || 0) < 2) continue;
          gagal++;
          problems.push(
            `${token} #${q.questionNumber} (${subject}): baris judul halaman bocor ke soal — ${baris.trim().slice(0, 70)}`,
          );
        }
      }

      const fromStem = stemNumber(q.questionText);
      const cands = locateAll(body, q.questionText);

      // Nilai tiap kandidat dari opsi A–D-nya: pola soal bisa sama antar butir
      // (mis. "Simpulan teks tersebut adalah ...."), jadi posisi pertama saja
      // tidak cukup untuk memastikan nomornya.
      let best: Loc | null = null;
      let skorTerbaik = -1;
      for (const c of cands) {
        const s = skorOpsi(body, c.numIdx, q);
        if (s > skorTerbaik) {
          best = c;
          skorTerbaik = s;
        }
      }
      if (fromStem !== null) {
        const sesuai = cands.find((c) => c.num === fromStem);
        if (sesuai) best = sesuai;
      }

      const num = fromStem ?? best?.num ?? null;
      if (num === null) {
        tanpaNomor++;
        problems.push(`${token} #${q.questionNumber} (${subject}): nomor asli tidak ditemukan di PDF`);
        console.log(`      [tanpa nomor] ${token} #${q.questionNumber} ${subject}`);
        console.log(`        teks: ${q.questionText.replace(/\s+/g, " ").slice(0, 240)}`);
        continue;
      }

      // Baris nomor yang tepat untuk membaca opsi. Untuk soal berbahan bacaan,
      // paragraf bisa mendahului baris nomornya, jadi cari ulang kalau berbeda.
      let numIdx = best?.numIdx ?? -1;
      if (best && fromStem !== null && best.num !== fromStem) {
        bedaNomor++;
        console.log(
          `      [catatan] ${token} #${q.questionNumber} ${subject}: nomor di teks=${fromStem}, posisi PDF=${best.num} — pakai teks`,
        );
        numIdx = findNumberLine(body, fromStem, best.idx);
      } else if (!best && fromStem !== null) {
        numIdx = findNumberLine(body, fromStem, 0);
      }

      const expected = keys.get(num);
      if (!expected) {
        gagal++;
        problems.push(`${token} #${q.questionNumber} (${subject}): kunci untuk soal ${num} tidak ada di PDF`);
        continue;
      }
      if (expected !== q.correctAnswer) {
        gagal++;
        problems.push(
          `${token} #${q.questionNumber} (${subject}): soal ${num} — PDF=${expected}, tersimpan=${q.correctAnswer}`,
        );
        console.log(`      [selisih] ${token} #${q.questionNumber} ${subject} nomor=${num}`);
        console.log(`        teks: ${q.questionText.replace(/\s+/g, " ").slice(0, 200)}`);
        continue;
      }
      cocok++;

      // Opsi A–D harus sama dengan yang tertulis di PDF pada soal bernomor itu.
      if (numIdx < 0) continue;
      const pdfOpts = readOptions(body, numIdx);
      const simpanan: Record<string, string> = {
        A: q.optionA,
        B: q.optionB,
        C: q.optionC,
        D: q.optionD,
      };
      for (const huruf of ["A", "B", "C", "D"]) {
        const stored = norm(simpanan[huruf] || "").slice(0, 45);
        if (!stored) continue;
        const pdf = pdfOpts.get(huruf);
        if (!pdf) {
          gagal++;
          problems.push(
            `${token} #${q.questionNumber} (${subject}): opsi ${huruf} tidak ada di PDF (soal ${num})`,
          );
          continue;
        }
        if (!(pdf.includes(stored) || stored.includes(pdf))) {
          gagal++;
          problems.push(
            `${token} #${q.questionNumber} (${subject}): opsi ${huruf} beda dengan PDF (soal ${num})`,
          );
          console.log(`      [opsi] ${token} #${q.questionNumber} ${subject} soal ${num} opsi ${huruf}`);
          console.log(`        PDF       : ${pdf.slice(0, 110)}`);
          console.log(`        tersimpan : ${stored.slice(0, 110)}`);
        }
      }
    }
  }
  return { cocok, gagal, tanpaNomor, bedaNomor };
}

async function check(token: string, expected: number) {
  const exam = await prisma.exam.findUnique({
    where: { token },
    include: { questions: { orderBy: { questionNumber: "asc" } } },
  });
  if (!exam) {
    console.log(`FAIL ${token}: paket tidak ada di database`);
    return false;
  }
  const qs = exam.questions;
  const problems: string[] = [];

  if (qs.length !== expected) problems.push(`jumlah soal ${qs.length}, harusnya ${expected}`);
  qs.forEach((q, i) => {
    if (q.questionNumber !== i + 1)
      problems.push(`nomor urut lompat di indeks ${i} (${q.questionNumber})`);
    if (!/^[A-E]$/.test(q.correctAnswer))
      problems.push(`#${q.questionNumber} kunci tidak sah: ${q.correctAnswer}`);
    for (const [nama, val] of [
      ["A", q.optionA],
      ["B", q.optionB],
      ["C", q.optionC],
      ["D", q.optionD],
    ] as const) {
      if (!val || !val.trim() || DUMMY.test(val.trim()))
        problems.push(`#${q.questionNumber} opsi ${nama} kosong`);
    }
    const gabungan = `${q.questionText} ${q.optionA} ${q.optionB} ${q.optionC} ${q.optionD}`;
    if (KEY_TEXT.test(gabungan))
      problems.push(`#${q.questionNumber} masih memuat teks kunci jawaban`);
    if (strip(q.questionText).replace(/«img»/g, "").trim().length < 5)
      problems.push(`#${q.questionNumber} isi soal kosong`);
  });

  const audit = await auditKeys(token, qs, problems);

  const perSubject = new Map<string, number>();
  let bergambar = 0;
  for (const q of qs) {
    perSubject.set(q.subject || "(tanpa)", (perSubject.get(q.subject || "(tanpa)") || 0) + 1);
    if (IMG_TEST.test(`${q.questionText}${q.optionA}${q.optionB}${q.optionC}${q.optionD}`))
      bergambar++;
  }

  console.log(`\n=== ${exam.title}`);
  console.log(
    `    token=${exam.token} kategori=${exam.category} durasi=${exam.durationMinutes} menit pass=${exam.passingScore}`,
  );
  console.log(`    soal=${qs.length}/${expected} bergambar=${bergambar}`);
  console.log(`    per seksi: ${[...perSubject].map(([k, v]) => `${k}=${v}`).join(", ")}`);
  console.log(
    `    audit kunci vs PDF: cocok=${audit.cocok} salah=${audit.gagal} tanpa nomor=${audit.tanpaNomor} catatan=${audit.bedaNomor}`,
  );

  if (problems.length) {
    console.log(`    FAIL (${problems.length}):`);
    for (const p of problems.slice(0, 12)) console.log(`      - ${p}`);
    return false;
  }
  console.log(`    OK tidak ada masalah`);

  const contoh = [0, Math.floor(qs.length / 2), qs.length - 1];
  for (const i of contoh) {
    const q = qs[i];
    console.log(`    [contoh #${q.questionNumber}] kunci=${q.correctAnswer} subjek=${q.subject}`);
    console.log(`      soal: ${strip(q.questionText).slice(0, 200)}`);
    console.log(
      `      A=${strip(q.optionA).slice(0, 60)} | B=${strip(q.optionB).slice(0, 60)} | ` +
        `C=${strip(q.optionC).slice(0, 60)} | D=${strip(q.optionD).slice(0, 60)}`,
    );
  }
  return true;
}

function strip(s: string | null) {
  return (s || "").replace(IMG, "«img»");
}

async function main() {
  const ok1 = await check("TPB-50", 50);
  const ok2 = await check("AKD-100", 100);
  const gagal = [!ok1 && "TPB-50", !ok2 && "AKD-100"].filter(Boolean);
  console.log(
    gagal.length ? `\nGAGAL: ${gagal.join(", ")}` : "\nSEMUA PAKET LULUS VERIFIKASI",
  );
  if (gagal.length) process.exitCode = 1;
}

main().finally(() => prisma.$disconnect());
