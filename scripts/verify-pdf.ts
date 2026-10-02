/**
 * Regresi ekstraksi naskah PDF: `npx tsx scripts/verify-pdf.ts`
 *
 * Setiap berkas di modul/ dicek terhadap jumlah soal yang benar (sama dengan
 * ekspektasi scripts/master_extractor.py) plus sejumlah syarat mutu, supaya
 * perubahan pada lib/pdf-extract.ts / lib/pdf-parser.ts ketahuan sebelum
 * dijalankan di server.
 *
 * DUMP="nama file.pdf#1-10" untuk mencetak isi soal hasil ekstraksi.
 */
import fs from "fs";
import path from "path";
import { extractStructuredFromPDF } from "../lib/pdf-extract";
import { parseQuestionsDetailed } from "../lib/pdf-parser";

const DUMMY = /^(pilihan|opsi)\s*[a-e]$/i;

type Extracted = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string | null;
};

const IMAGE_MD = /!\[[^\]]*\]\([^)]*\)/;

/** Bidang yang bisa memuat gambar, sesuai urutan tampil di naskah. */
const IMAGE_FIELDS = [
  "questionText",
  "optionA",
  "optionB",
  "optionC",
  "optionD",
  "optionE",
] as const;

/** Mana saja dari pertanyaan/pilihan yang membawa gambar. */
function imageSlots(q: Partial<Extracted>): string[] {
  return IMAGE_FIELDS.filter((field) =>
    IMAGE_MD.test((q[field as keyof Extracted] as string) || ""),
  );
}

const EXPECTED: Record<string, number> = {
  "Bahasa Arab 2-4.pdf": 15,
  "Bahasa Indonesia 5-6.pdf": 10,
  "Bahasa Inggris 7-10.pdf": 15,
  "IPA 44-48.pdf": 13,
  "IPS 49-53.pdf": 13,
  "Keislaman 54-61.pdf": 22,
  "Matematika 62-67.pdf": 15,
  "Kemampuan Analitik 266-271.pdf": 20,
  "TA MAN-IC Paket 1 11-43.pdf": 80,
  "TA MAN-PK Paket 1 68-97.pdf": 70,
  "Tes Akademik Ipa 98-126.pdf": 75,
  "Tes Akademik Ips 127-156.pdf": 75,
  "Tes Keislaman 157-181.pdf": 70,
  "Tes Akademik Ipa 182-210.pdf": 75,
  "Tes Akademik Ips 211-240.pdf": 75,
  "Tes Keislaman 241-265.pdf": 70,
};

/**
 * Jumlah butir yang penempatan gambarnya sudah sama persis dengan keluaran
 * referensi master_extractor.py. Dipakai sebagai pagar regresi: bila angkanya
 * turun, berarti gambar mulai jatuh ke soal/pilihan yang salah lagi.
 */
const MIN_PLACEMENT_MATCH = 663;

/** Berkas berikut memang punya gambar soal (kop/logo sudah otomatis dibuang). */
const MIN_IMAGES: Record<string, number> = {
  "Bahasa Arab 2-4.pdf": 1,
  "IPA 44-48.pdf": 1,
  "IPS 49-53.pdf": 1,
  "Keislaman 54-61.pdf": 1,
  "Kemampuan Analitik 266-271.pdf": 1,
};

async function main() {
  const args = process.argv.slice(2);
  const targets =
    args.length > 0
      ? args.map((f) => path.resolve(process.cwd(), f))
      : fs
          .readdirSync("modul")
          .filter((f) => f.toLowerCase().endsWith(".pdf"))
          .map((f) => path.join("modul", f));

  const failures: string[] = [];
  let totalQuestions = 0;
  let totalImages = 0;
  let slowest = 0;
  /** Hasil per berkas, dipakai untuk membandingkan penempatan gambar. */
  const oursByFile = new Map<string, Extracted[]>();

  for (const file of targets) {
    const name = path.basename(file);
    const started = Date.now();
    try {
      const buffer = fs.readFileSync(path.resolve(process.cwd(), file));
      const ext = await extractStructuredFromPDF(buffer);
      const parsed = parseQuestionsDetailed(ext.text);
      const qs = parsed.questions;
      const ms = Date.now() - started;
      slowest = Math.max(slowest, ms);
      totalQuestions += qs.length;
      totalImages += ext.imageCount;
      oursByFile.set(name, qs as unknown as Extracted[]);

      const tanpaOpsi = qs.filter((q) =>
        [q.optionA, q.optionB, q.optionC, q.optionD].every((o) =>
          DUMMY.test((o || "").trim()),
        ),
      ).length;
      const opsiSebagian = qs.filter((q) => {
        const real = [q.optionA, q.optionB, q.optionC, q.optionD].filter(
          (o) => o && !DUMMY.test(o.trim()),
        ).length;
        return real >= 2 && real < 4;
      }).length;
      const denganGambar = qs.filter((q) =>
        [q.questionText, q.optionA, q.optionB, q.optionC, q.optionD].some(
          (t) => /!\[[^\]]*\]\([^)]*\)/.test(t || ""),
        ),
      ).length;

      const problems: string[] = [];
      const expected = EXPECTED[name];
      if (expected !== undefined && qs.length !== expected) {
        problems.push(`soal ${qs.length}, seharusnya ${expected}`);
      }
      if (tanpaOpsi > 0) {
        problems.push(`${tanpaOpsi} soal tanpa opsi A-D yang terbaca`);
      }
      const minImages = MIN_IMAGES[name];
      if (minImages !== undefined && ext.imageCount < minImages) {
        problems.push(`gambar ${ext.imageCount}, minimal ${minImages}`);
      }
      if (parsed.strategy === "fallback") {
        problems.push("jatuh ke parser cadangan (hanya 1 soal terbaca)");
      }

      const status = problems.length === 0 ? "OK  " : "FAIL";
      if (problems.length > 0) failures.push(`${name}: ${problems.join("; ")}`);

      console.log(
        `${status} ${name.padEnd(38)} soal=${String(qs.length).padStart(3)}` +
          `${expected !== undefined ? "/" + expected : "   "}` +
          ` gambar=${String(ext.imageCount).padStart(2)}` +
          ` (di soal=${denganGambar}) strategi=${parsed.strategy}` +
          ` tanpaOpsi=${tanpaOpsi} opsiSebagian=${opsiSebagian}` +
          ` teks=${ext.text.length} ${ms}ms`,
      );
      if (parsed.warnings.length) {
        console.log(`     peringatan: ${parsed.warnings.join(" | ")}`);
      }

      const [dumpFile, dumpRange] = (process.env.DUMP || "").split("#");
      if (dumpFile === name) {
        const [a, b] = (dumpRange || "1-9999").split("-").map(Number);
        for (const q of qs.slice(a - 1, b)) {
          const strip = (s: string) =>
            s.replace(/!\[[^\]]*\]\([^)]*\)/g, "[IMG]");
          console.log(`     [${q.questionNumber}] ${JSON.stringify(strip(q.questionText))}`);
          console.log(
            `         A=${JSON.stringify(strip(q.optionA))} B=${JSON.stringify(strip(q.optionB))}` +
              ` C=${JSON.stringify(strip(q.optionC).slice(0, 60))} D=${JSON.stringify(strip(q.optionD).slice(0, 60))}`,
          );
        }
      }
    } catch (error: any) {
      failures.push(`${name}: ${error?.message || error}`);
      console.log(`FAIL ${name} -> ${error?.message || error}`);
    }
  }

  // Penempatan gambar dibandingkan dengan keluaran referensi master_extractor.py:
  // bukan cuma jumlah gambarnya, tapi soal/pilihan mana yang memuat gambar juga
  // harus sama supaya hasil ekstraksi selaras dengan isi PDF.
  const refDir = path.join("scripts", "extracted_exams");
  let slotCompared = 0;
  let slotMismatches = 0;
  let slotFiles = 0;
  const slotKinds: Record<string, number> = {};
  const slotPatterns: Record<string, number> = {};

  if (args.length === 0 && fs.existsSync(refDir)) {
    for (const refFile of fs.readdirSync(refDir).filter((f) => f.endsWith(".json"))) {
      let ref: any;
      try {
        ref = JSON.parse(fs.readFileSync(path.join(refDir, refFile), "utf8"));
      } catch {
        continue;
      }
      const name = path.basename(ref?.config?.file || "");
      const mine = oursByFile.get(name);
      if (!mine || !Array.isArray(ref?.questions)) continue;

      slotFiles++;
      if (mine.length !== ref.questions.length) {
        failures.push(
          `${name}: jumlah soal ${mine.length}, referensi ${ref.questions.length}`,
        );
      }
      const shared = Math.min(mine.length, ref.questions.length);
      for (let i = 0; i < shared; i++) {
        slotCompared++;
        const expectedSlots = imageSlots(ref.questions[i]);
        const actualSlots = imageSlots(mine[i]);
        if (expectedSlots.join(",") === actualSlots.join(",")) continue;
        slotMismatches++;
        const kind =
          expectedSlots.length > 0 && actualSlots.length === 0
            ? "hilang"
            : expectedSlots.length === 0 && actualSlots.length > 0
              ? "tambahan"
              : "geser";
        slotKinds[kind] = (slotKinds[kind] || 0) + 1;
        const pattern = `${kind}: [${expectedSlots.join(",") || "-"}] -> [${actualSlots.join(",") || "-"}]`;
        slotPatterns[pattern] = (slotPatterns[pattern] || 0) + 1;
        if (slotPatterns[pattern] <= 3) {
          console.log(`     ${name} soal #${i + 1}  ${pattern}`);
        }
      }
    }
  }

  const kindsText = Object.entries(slotKinds)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ");
  if (slotFiles > 0) {
    const matched = slotCompared - slotMismatches;
    console.log(
      `\nPenempatan gambar: ${matched}/${slotCompared} butir` +
        ` tepat di ${slotFiles} berkas` +
        (slotMismatches ? ` (selisih ${slotMismatches}: ${kindsText})` : ""),
    );
    for (const [pattern, count] of Object.entries(slotPatterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12)) {
      console.log(`   ${String(count).padStart(3)}x ${pattern}`);
    }
    // Pagar regresi: penempatan gambar per butir harus tetap minimal sebaik
    // sekarang, bukan kembali seperti dulu (gambar menempel di opsi terakhir
    // butir sebelumnya).
    if (matched < MIN_PLACEMENT_MATCH) {
      failures.push(
        `penempatan gambar hanya ${matched}/${slotCompared} butir, minimal ${MIN_PLACEMENT_MATCH}`,
      );
    }
  }

  console.log(
    `\nTOTAL ${totalQuestions} soal, ${totalImages} gambar, lambat=${slowest}ms`,
  );
  if (failures.length > 0) {
    console.log("\nGAGAL:");
    for (const f of failures) console.log(`  - ${f}`);
    process.exit(1);
  }
  console.log("Semua naskah lolos pemeriksaan.");
}

main();
