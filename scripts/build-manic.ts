/**
 * Susun paket tryout dari naskah PDF di modul/MANIC.
 *
 *  - Blok kunci jawaban (KUNCI JAWABAN / ANSWER KEY) dipotong sebelum parsing
 *    supaya slide kunci tidak ikut jadi butir soal.
 *  - Kunci dari blok itu dipakai untuk mengisi correctAnswer tiap butir.
 *  - Butir berkunci ganda ("A dan D") tidak dipakai: panel peserta hanya bisa
 *    memilih satu huruf, jadi soal begitu mustahil dinilai benar.
 *  - Butir diambil merata dari tiap sumber, lalu dinomori ulang 1..N.
 *
 * Pakai:  npx tsx scripts/build-manic.ts          (dry run, tidak menulis DB)
 *         npx tsx scripts/build-manic.ts --apply   (tulis ke database)
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { extractStructuredFromPDF } from "../lib/pdf-extract";
import { parseQuestionsDetailed } from "../lib/pdf-parser";

export interface SourceSpec {
  file: string;
  subject: string;
  expected: number;
  /** Jumlah butir yang diambil dari PDF ini. Jumlah semua sumber = total paket. */
  take?: number;
}

export interface PackageSpec {
  dir: string;
  title: string;
  description: string;
  category: string;
  token: string;
  total: number;
  durationMinutes: number;
  passingScore: number;
  sources: SourceSpec[];
}

export const PACKAGES: PackageSpec[] = [
  {
    dir: "modul/MANIC/TPB",
    title: "Tryout TPB MAN Insan Cendekia (50 Soal)",
    description:
      "Gabungan Tes Verbal, Numerik, Analitik, dan Keislaman — 50 soal terpilih merata dari seluruh naskah TPB.",
    category: "Tes Potensi Skolastik (TPS)",
    token: "TPB-50",
    total: 50,
    durationMinutes: 60,
    passingScore: 65,
    sources: [
      { file: "Soal_Verbal_20Soal.pdf", subject: "TPB: Verbal", expected: 20, take: 13 },
      { file: "Soal_Numerik_15Soal.pdf", subject: "TPB: Numerik", expected: 15, take: 13 },
      { file: "Soal_Analitik_15Soal.pdf", subject: "TPB: Analitik", expected: 15, take: 12 },
      { file: "Soal_Tes_Keislaman_25.pdf", subject: "TPB: Keislaman", expected: 25, take: 12 },
    ],
  },
  {
    dir: "modul/MANIC/Akademik",
    title: "Tryout Akademik MAN Insan Cendekia (100 Soal)",
    description:
      "Gabungan Bahasa Arab, Bahasa Indonesia, Bahasa Inggris, IPA, Matematika, dan Keislaman — 100 soal terpilih merata dari seluruh naskah Akademik.",
    category: "SNPDB MAN IC",
    token: "AKD-100",
    total: 100,
    durationMinutes: 120,
    passingScore: 70,
    sources: [
      { file: "Soal_Bahasa_Arab_25.pdf", subject: "Akademik: Bahasa Arab", expected: 25, take: 17 },
      {
        file: "Soal_Bahasa_Indonesia_25 (1).pdf",
        subject: "Akademik: Bahasa Indonesia",
        expected: 25,
        take: 17,
      },
      {
        file: "Soal_Bahasa_Inggris_25_Soal.pdf",
        subject: "Akademik: Bahasa Inggris",
        expected: 25,
        take: 17,
      },
      { file: "Soal_IPA_25_Soal.pdf", subject: "Akademik: IPA", expected: 25, take: 17 },
      {
        file: "Soal_Matematika_25_Soal.pdf",
        subject: "Akademik: Matematika",
        expected: 25,
        take: 16,
      },
      {
        file: "Soal_Tes_Keislaman_25.pdf",
        subject: "Akademik: Keislaman",
        expected: 25,
        take: 16,
      },
    ],
  },
];

const KEY_HEADER_RE = /^\s*(KUNCI\s+JAWABAN|ANSWER\s+KEY)\b/i;
/** "A. teks" / "(A) teks" di awal baris — dipakai untuk menolak baris opsi. */
const OPTION_LINE_RE = /^\s*(\()?([A-Ea-e])\s*([.)])\s*/;
const NOTE_LINE_RE = /^(catatan|note|question\s+answer|no\.?\s+jawaban)\b/i;
const KEY_PAIR_RE =
  /(?:^|[^\d])(\d{1,3})(?:[.:\-)]\s*|\s+)([A-Ea-e](?:\s*(?:dan|,|&|\/|\+)\s*[A-Ea-e])*)(?=\s|$)/gi;
/**
 * Baris kunci soal penyandingan, mis. "3 1-b, 2-c, 3-d, 4-a". Isinya deretan
 * pasangan nomor–huruf kecil; kalau ikut dibaca, nomor 4 terlanjur diisi "A"
 * dari baris itu sehingga soal 4 tidak terdeteksi berkunci ganda.
 */
const PAIRING_KEY_RE = /\d+\s*[-–]\s*[A-Da-d]/g;
const IMAGE_TOKEN = /!\[[^\]]*\]\([^)]*\)/;
const DUMMY_OPTION_RE = /^(pilihan|opsi)\s*[a-e]$/i;

/**
 * Nomor asli yang tertulis di badan soal ("7. Sinonim dari …"). Parser kadang
 * memberi nomor blok yang meleset karena paragraf pembuka ikut kehitung, jadi
 * nomor dipercaya dari isi PDF-nya sendiri — bukan dari urutan parser.
 */
function sourceNumber(questionText: string): number | null {
  const m = questionText.match(/(?:^|\n)\s*(?:soal\s*)?(\d{1,3})[.):]\s*(?=[^\s])/);
  return m ? parseInt(m[1], 10) : null;
}

/** Baris teks seperti yang dilihat parser (gabar markdown tetap utuh). */
function toLines(rawText: string): string[] {
  return rawText
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .split("\n")
    .map((l) => l.replace(/[  ]+/g, " ").trim());
}

/** Indeks baris pertama yang memuat penanda slide kunci jawaban. */
function findKeyStart(lines: string[]): number {
  return lines.findIndex((l) => KEY_HEADER_RE.test(l));
}

/** Baca kunci jawaban: nomor butir -> huruf kunci. Urutan pertama menang. */
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

export interface LoadedSource {
  subject: string;
  parsed: number;
  stemStyle: boolean;
  usable: any[];
  numbers: number[];
  droppedNoNumber: number[];
  droppedNoKey: number[];
  droppedMulti: number[];
  droppedEmptyOption: number[];
  images: number;
  rawKeyLines: string[];
  keyMap: [number, string][];
}

const normText = (s: string) =>
  s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/**
 * Judul halaman yang diulang tiap halaman (mis. "English Reading Comprehension –
 * 25 Questions", "Latihan Soal IPA – 25 Soal"). Dikenali karena teksnya terkandung
 * di kop dokumen dan kemunculannya berulang — bukan isi soal biasa.
 */
function isPageTitle(line: string, kop: string, hit: Map<string, number>): boolean {
  if (OPTION_LINE_RE.test(line) || /^\d{1,3}[.)]/.test(line)) return false;
  const n = normText(line);
  if (n.length < 10 || !kop.includes(n)) return false;
  return (hit.get(n) || 0) >= 2;
}

export async function loadSource(spec: SourceSpec, dir: string): Promise<LoadedSource> {
  const file = path.join(process.cwd(), dir, spec.file);
  const ext = await extractStructuredFromPDF(fs.readFileSync(file));
  const lines = toLines(ext.text);

  const keyStart = findKeyStart(lines);
  if (keyStart < 0) {
    throw new Error(`${spec.file}: penanda kunci jawaban tidak ditemukan`);
  }

  // Kop = baris sebelum soal pertama. Judul halaman diulang di tiap halaman,
  // jadi harus dibuang dari hasil akhir — tetapi tidak boleh disentuh di teks
  // yang diparse, karena itu bisa mengubah cara pembagian butir.
  const kopParts: string[] = [];
  for (const l of lines) {
    const t = l.trim();
    if (!t) continue;
    if (/^\d{1,3}[.)]/.test(t) || OPTION_LINE_RE.test(t)) break;
    kopParts.push(t);
  }
  const kop = normText(kopParts.join(" "));
  const hit = new Map<string, number>();
  for (const l of lines) {
    const t = l.trim();
    if (!t || OPTION_LINE_RE.test(t) || /^\d{1,3}[.)]/.test(t)) continue;
    const n = normText(t);
    if (n.length >= 10) hit.set(n, (hit.get(n) || 0) + 1);
  }
  const stripPageTitles = (text: string): string => {
    if (!text) return text;
    return text
      .split("\n")
      .filter((l) => !isPageTitle(l.trim(), kop, hit))
      .join("\n")
      .trim();
  };

  // Potong tepat di awal slide kunci — slide itu tidak boleh jadi butir soal.
  const body = lines.slice(0, keyStart).join("\n");
  const keys = parseKeys(lines.slice(keyStart));

  const parsed = parseQuestionsDetailed(body);
  for (const q of parsed.questions) {
    q.questionText = stripPageTitles(q.questionText);
    q.optionA = stripPageTitles(q.optionA);
    q.optionB = stripPageTitles(q.optionB);
    q.optionC = stripPageTitles(q.optionC);
    q.optionD = stripPageTitles(q.optionD);
  }

  // Dua gaya penomoran di naskah ini: ada yang menyisakan nomor asli di awal
  // badan soal (grup opsi), ada yang nomornya dipakai parser lalu dibuang dari
  // teks (penomoran). Pilih gaya yang dominan supaya kunci jawaban tidak salah
  // tukar karena nomor blok meleset satu akibat kop/b petunjuk.
  const withNumber = parsed.questions.filter(
    (q) => sourceNumber(q.questionText) !== null,
  ).length;
  const stemStyle = withNumber >= Math.ceil(parsed.questions.length * 0.6);

  const usable: any[] = [];
  const droppedNoNumber: number[] = [];
  const droppedNoKey: number[] = [];
  const droppedMulti: number[] = [];
  const droppedEmptyOption: number[] = [];
  const numbers: number[] = [];

  for (const q of parsed.questions) {
    const sn = sourceNumber(q.questionText);
    const num = stemStyle ? sn : q.questionNumber;
    if (num === null) {
      // Blok pembuka (kop/petunjuk) — bukan butir soal.
      droppedNoNumber.push(q.questionNumber);
      continue;
    }
    numbers.push(num);
    const key = keys.get(num);
    const options = [q.optionA, q.optionB, q.optionC, q.optionD];
    const empty = options.some(
      (o) => !o || !o.trim() || DUMMY_OPTION_RE.test(o.trim()),
    );
    if (empty) {
      droppedEmptyOption.push(num);
      continue;
    }
    if (!key) {
      droppedNoKey.push(num);
      continue;
    }
    if (key.includes(",")) {
      droppedMulti.push(num);
      continue;
    }
    usable.push({
      ...q,
      sourceNumber: num,
      correctAnswer: key,
      subject: spec.subject,
    });
  }

  const rawKeyLines = lines
    .slice(keyStart)
    .map((l) => l.replace(/!\[[^\]]*\]\([^)]*\)/g, "«img»").slice(0, 130))
    .filter((l) => !KEY_HEADER_RE.test(l));

  return {
    subject: spec.subject,
    parsed: parsed.questions.length,
    stemStyle,
    usable,
    numbers,
    rawKeyLines,
    keyMap: [...keys.entries()].sort((a, b) => a[0] - b[0]),
    droppedNoNumber,
    droppedNoKey,
    droppedMulti,
    droppedEmptyOption,
    images: ext.imageCount,
  };
}

/** Bagi `total` ke n sumber setara mungkin, dibatasi kapasitas tiap sumber. */
function distribute(total: number, capacities: number[]): number[] {
  const n = capacities.length;
  const quota = capacities.map((c) => Math.min(Math.floor(total / n), c));
  let extra = total - quota.reduce((a, b) => a + b, 0);
  while (extra > 0) {
    let moved = false;
    for (let i = 0; i < n && extra > 0; i++) {
      if (quota[i] < capacities[i]) {
        quota[i]++;
        extra--;
        moved = true;
      }
    }
    if (!moved) break;
  }
  return quota;
}

/** Ambil k butir merata di sepanjang daftar (bukan cuma yang paling depan). */
export function pickEvenly<T>(arr: T[], k: number): T[] {
  if (k >= arr.length) return arr.slice();
  const out: T[] = [];
  for (let i = 0; i < k; i++) {
    out.push(arr[Math.floor(((i + 0.5) * arr.length) / k)]);
  }
  return out;
}

function reportPackage(spec: PackageSpec, loaded: LoadedSource[]): any[] {
  console.log(`\n=========== ${spec.title}`);
  let capacity = 0;
  let srcIdx = 0;
  for (const l of loaded) {
    capacity += l.usable.length;
    const expected = spec.sources[srcIdx]?.expected ?? 0;
    srcIdx++;
    const nums = [...l.numbers].sort((a, b) => a - b);
    const dup = nums.filter((v, i) => i > 0 && v === nums[i - 1]);
    const missing: number[] = [];
    for (let n = 1; n <= expected; n++) if (!nums.includes(n)) missing.push(n);
    if (dup.length) console.log(`  !! ${l.subject}: nomor asli kembar ${dup.join("/")}`);
    if (missing.length)
      console.log(`  ?? ${l.subject}: nomor tidak terbaca dari PDF ${missing.join("/")}`);
    const drop: string[] = [];
    if (l.droppedNoNumber.length)
      drop.push(`bukan butir=${l.droppedNoNumber.join("/")}`);
    if (l.droppedNoKey.length) drop.push(`tanpa kunci=${l.droppedNoKey.join("/")}`);
    if (l.droppedMulti.length) drop.push(`kunci ganda=${l.droppedMulti.join("/")}`);
    if (l.droppedEmptyOption.length)
      drop.push(`opsi kosong=${l.droppedEmptyOption.join("/")}`);
    console.log(
      `  ${l.subject.padEnd(26)} gambar=${String(l.images).padStart(2)} ` +
        `terbaca=${String(l.parsed).padStart(2)} siap pakai=${String(l.usable.length).padStart(2)} ` +
        `nomor=${l.stemStyle ? "isi-soal" : "parser"}` +
        (drop.length ? `  [${drop.join(", ")}]` : ""),
    );
    if (process.env.SHOW_KEYS) {
      console.log(`      asli : ${l.rawKeyLines.join(" | ")}`);
      console.log(`      hasil: ${l.keyMap.map(([n, k]) => `${n}=${k}`).join(" ")}`);
    }
  }
  const fixed = spec.sources.map((s) => s.take);
  const quota = fixed.every((n) => typeof n === "number")
    ? (fixed as number[])
    : distribute(spec.total, loaded.map((l) => l.usable.length));
  const quotaSum = quota.reduce((a, b) => a + b, 0);
  if (quotaSum !== spec.total)
    console.log(`  !! jumlah jatah per PDF ${quotaSum}, target ${spec.total}`);
  quota.forEach((q, i) => {
    if (q > loaded[i].usable.length)
      console.log(
        `  !! ${loaded[i].subject}: jatah ${q} melebihi soal siap pakai ${loaded[i].usable.length}`,
      );
  });
  const picked: any[] = [];
  loaded.forEach((l, i) => {
    const chosen = pickEvenly(l.usable, quota[i]);
    console.log(
      `  -> ${l.subject.padEnd(26)} ambil ${chosen.length} dari ${l.usable.length}`,
    );
    picked.push(...chosen);
  });

  if (picked.length !== spec.total) {
    console.log(
      `  !! TOTAL ${picked.length} butir, target ${spec.total} ` +
        `(kapasitas siap pakai ${capacity})`,
    );
  } else {
    console.log(`  OK total ${picked.length} butir (kapasitas siap pakai ${capacity})`);
  }
  return picked;
}

function audit(picked: any[], spec: PackageSpec) {
  const problems: string[] = [];
  const hasKeyText = picked.filter(
    (q) =>
      /kunci\s*jawaban|answer\s*key/i.test(q.questionText) ||
      /kunci\s*jawaban|answer\s*key/i.test(`${q.optionA} ${q.optionB} ${q.optionC} ${q.optionD}`),
  );
  if (hasKeyText.length) problems.push(`${hasKeyText.length} butir masih memuat teks kunci`);

  const badKey = picked.filter(
    (q) => !/^[A-E]$/.test(String(q.correctAnswer).toUpperCase()),
  );
  if (badKey.length) problems.push(`${badKey.length} butir berkunci ganda/tidak sah`);

  const dummy = picked.filter((q) =>
    [q.optionA, q.optionB, q.optionC, q.optionD].some(
      (o) => !o || !o.trim() || DUMMY_OPTION_RE.test(o.trim()),
    ),
  );
  if (dummy.length) problems.push(`${dummy.length} butir punya opsi kosong`);

  const noImage = picked.filter((q) => IMAGE_TOKEN.test(q.questionText) ||
    [q.optionA, q.optionB, q.optionC, q.optionD, q.optionE || ""].some((o) => IMAGE_TOKEN.test(o)));
  const shortStem = picked.filter(
    (q) => q.questionText.replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim().length < 5,
  );
  if (shortStem.length) problems.push(`${shortStem.length} butir stem hampir kosong`);

  console.log(
    `  audit: gambar=${noImage.length} butir | soal berkunci ganda tertinggal=` +
      `${picked.filter((q) => q.correctAnswer.includes(",")).length}`,
  );
  console.log(
    problems.length ? `  !! ${problems.join("; ")}` : "  audit: tidak ada masalah",
  );
  return problems.length === 0;
}

async function applyPackage(spec: PackageSpec, picked: any[], prisma: PrismaClient) {
  const existing = await prisma.exam.findUnique({
    where: { token: spec.token },
    include: { _count: { select: { sessions: true } } },
  });
  if (existing && existing._count.sessions > 0) {
    throw new Error(
      `Token ${spec.token} sudah dipakai dan punya ${existing._count.sessions} sesi peserta — batal.`,
    );
  }
  if (existing) {
    await prisma.question.deleteMany({ where: { examId: existing.id } });
    await prisma.exam.delete({ where: { id: existing.id } });
    console.log(`  membersihkan paket lama ${spec.token}`);
  }

  const exam = await prisma.exam.create({
    data: {
      title: spec.title,
      description: spec.description,
      category: spec.category,
      durationMinutes: spec.durationMinutes,
      passingScore: spec.passingScore,
      token: spec.token,
      isActive: true,
      questions: {
        create: picked.map((q, i) => ({
          questionNumber: i + 1,
          questionText: q.questionText,
          optionA: q.optionA,
          optionB: q.optionB,
          optionC: q.optionC,
          optionD: q.optionD,
          optionE: q.optionE || null,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || null,
          subject: q.subject,
          points: 4,
        })),
      },
    },
    include: { _count: { select: { questions: true } } },
  });
  console.log(
    `  DIBUAT: ${exam.title} | token=${exam.token} | soal=${exam._count.questions}`,
  );
  return exam;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const prisma = new PrismaClient();
  let ok = true;

  try {
    for (const spec of PACKAGES) {
      const loaded: LoadedSource[] = [];
      for (const src of spec.sources) {
        const l = await loadSource(src, spec.dir);
        loaded.push(l);
        if (l.parsed !== src.expected) {
          console.log(
            `  !! ${src.file}: parser membaca ${l.parsed} butir, naskah menyebut ${src.expected}`,
          );
        }
      }
      const picked = reportPackage(spec, loaded);
      if (picked.length !== spec.total) ok = false;
      if (!audit(picked, spec)) ok = false;

      if (apply && picked.length === spec.total) {
        await applyPackage(spec, picked, prisma);
      } else if (apply) {
        console.log("  --apply dilewati karena jumlah butir belum pas.");
      }
    }
    if (!apply) console.log("\n(dry run — jalankan dengan --apply untuk menulis ke DB)");
    if (!ok) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

// Jangan jalankan build saat modul ini diimpor (mis. oleh skrip laporan soal).
const entry = (process.argv[1] || "").replace(/\\/g, "/");
if (/build-manic\.[cm]?[jt]s$/.test(entry)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
