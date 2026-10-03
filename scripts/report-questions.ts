/**
 * Laporan pemetaan soal CBT -> naskah sumber.
 *
 * Menjalankan ulang logika pemilihan di scripts/build-manic.ts (loadSource +
 * pickEvenly, tanpa menulis database), lalu mencocokkan hasilnya ke baris
 * Question yang benar-benar ada di database. Keluaran:
 *
 *   laporan-soal/Laporan-Soal-<TOKEN>.pdf   naskah rapi per paket
 *   laporan-soal/daftar-soal-<TOKEN>.csv    ringkas untuk spreadsheet
 *   laporan-soal/<TOKEN>.html               sumber PDF (cadangan)
 *
 * Pakai: npm run report:soal        (atau: npx tsx scripts/report-questions.ts)
 * Exit code 1 kalau ada butir yang tidak terverifikasi.
 */
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { chromium } from "playwright";
import { PACKAGES, loadSource, pickEvenly } from "../scripts/build-manic";

const OUT_DIR = path.join(process.cwd(), "laporan-soal");

type Row = {
  no: number;
  subject: string;
  file: string;
  dir: string;
  srcNo: number;
  key: string;
  text: string;
  options: (string | null)[];
  dbText: string;
  sim: number;
  embedded: number | null;
  status: "OK" | "CEK" | "SELISIH";
};

const normWords = (s: string) =>
  s
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 240);

/** Panjang run kata berurutan terpanjang antara dua larik kata. */
function longestRun(a: string[], b: string[]): number {
  let prev = new Array<number>(b.length + 1).fill(0);
  let best = 0;
  for (let i = 1; i <= a.length; i++) {
    const cur = new Array<number>(b.length + 1).fill(0);
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        cur[j] = prev[j - 1] + 1;
        if (cur[j] > best) best = cur[j];
      }
    }
    prev = cur;
  }
  return best;
}

const leadingNumber = (t: string): number | null => {
  const m = t.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").trim().match(/^(\d{1,3})[.)]\s/);
  return m ? parseInt(m[1], 10) : null;
};

const esc = (t: string) =>
  t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function mdToHtml(s: string): string {
  let h = esc(s);
  h = h.replace(
    /!\[([^\]]*)\]\(([^)]*)\)/g,
    (_m, alt: string, src: string) =>
      `<img src="${src}" alt="${alt}" class="fig">`,
  );
  h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  h = h.replace(/`([^`]+)`/g, "<code>$1</code>");
  h = h.replace(/\n/g, "<br>");
  return h;
}

const csvCell = (v: string) =>
  `"${String(v).replace(/\s+/g, " ").replace(/"/g, '""')}"`;

async function buildPackage(spec: (typeof PACKAGES)[number], prisma: PrismaClient) {
  const picked: any[] = [];
  const sourceInfo: {
    file: string;
    subject: string;
    parsed: number;
    usable: number;
    numbers: number[];
    allNumbers: number[];
  }[] = [];

  for (const src of spec.sources) {
    const l = await loadSource(src, spec.dir);
    if (typeof src.take !== "number") throw new Error(`${src.file}: take tidak diisi`);
    const chosen = pickEvenly(l.usable, src.take);
    sourceInfo.push({
      file: src.file,
      subject: src.subject,
      parsed: l.parsed,
      usable: l.usable.length,
      numbers: l.usable.map((u: any) => u.sourceNumber as number),
      allNumbers: l.numbers,
    });
    console.log(
      `  ${src.subject.padEnd(26)} ${src.file.padEnd(34)} terbaca=${l.parsed} ` +
        `siap=${l.usable.length} ambil=${chosen.length}`,
    );
    for (const q of chosen) picked.push({ ...q, file: src.file, dir: spec.dir });
  }

  const exam = await prisma.exam.findUnique({
    where: { token: spec.token },
    include: { questions: { orderBy: { questionNumber: "asc" } } },
  });
  if (!exam) throw new Error(`Paket ${spec.token} tidak ada di database`);
  console.log(
    `  total: hasil build=${picked.length} | di database=${exam.questions.length}`,
  );

  const rows: Row[] = [];
  const problems: string[] = [];
  const n = Math.min(picked.length, exam.questions.length);
  if (picked.length !== exam.questions.length)
    problems.push(`jumlah beda: build=${picked.length} db=${exam.questions.length}`);

  for (let i = 0; i < n; i++) {
    const p = picked[i];
    const d = exam.questions[i];
    const pw = normWords(p.questionText);
    const dw = normWords(d.questionText);
    const sim = longestRun(pw, dw);
    /** Seluruh butir naskah (stem pendek sekalipun) ada utuh di teks DB. */
    const contained = pw.length > 0 && sim >= pw.length;
    const embedded = leadingNumber(d.questionText);
    const subjectOk = p.subject === d.subject;
    let status: Row["status"] = "OK";
    if (embedded !== null && p.sourceNumber !== embedded) status = "SELISIH";
    else if (!contained && sim < 5 && !(embedded !== null && embedded === p.sourceNumber))
      status = "CEK";
    if (!subjectOk) status = "SELISIH";

    rows.push({
      no: d.questionNumber,
      subject: d.subject || p.subject,
      file: p.file,
      dir: p.dir,
      srcNo: p.sourceNumber,
      key: d.correctAnswer,
      text: d.questionText,
      options: [d.optionA, d.optionB, d.optionC, d.optionD, d.optionE],
      dbText: d.questionText,
      sim,
      embedded,
      status,
    });
  }

  const cek = rows.filter((r) => r.status !== "OK");
  console.log(
    `  verifikasi: OK=${rows.length - cek.length} SELISIH=${rows.filter((r) => r.status === "SELISIH").length} ` +
      `CEK=${rows.filter((r) => r.status === "CEK").length}`,
  );
  for (const r of cek) {
    const head = r.dbText.replace(/!\[[^\]]*\]\([^)]*\)/g, " ").replace(/\s+/g, " ").slice(0, 64);
    console.log(
      `    ! #${r.no} [${r.status}] naskah#${r.srcNo} sim=${r.sim} embedded=${r.embedded} | ${head}`,
    );
  }
  problems.push(...cek.map((r) => `#${r.no} status=${r.status}`));

  return { spec, exam, rows, sourceInfo, problems };
}

function buildHtml(pkg: Awaited<ReturnType<typeof buildPackage>>) {
  const { spec, exam, rows, sourceInfo } = pkg;
  const grouped = new Map<string, Row[]>();
  for (const r of rows) {
    if (!grouped.has(r.subject)) grouped.set(r.subject, []);
    grouped.get(r.subject)!.push(r);
  }

  const parts: string[] = [];
  parts.push(`<!doctype html><html lang="id"><head><meta charset="utf-8">
<title>Daftar Soal ${spec.token}</title>
<style>
  @page { size: A4; margin: 14mm 12mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; font-size: 10.4pt;
         color: #0f172a; margin: 0; line-height: 1.45; }
  h1 { font-size: 20pt; margin: 0 0 2mm; letter-spacing: -.02em; }
  h2 { font-size: 13.5pt; margin: 7mm 0 2mm; padding-bottom: 1.5mm;
       border-bottom: 1.6pt solid #0f172a; break-after: avoid; }
  h3 { font-size: 10.5pt; margin: 4mm 0 1.5mm; color: #334155; break-after: avoid; }
  .muted { color: #64748b; }
  .meta { width: 100%; border-collapse: collapse; margin: 3mm 0 1mm; font-size: 9.6pt; }
  .meta td { border: 1px solid #e2e8f0; padding: 1.6mm 2.4mm; vertical-align: top; }
  .meta td.k { background: #f8fafc; width: 34mm; color: #475569; font-weight: 600; }
  .nums { font-size: 9.4pt; background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 6px; padding: 2.2mm 3mm; margin: 2mm 0 3mm; }
  .q { break-inside: avoid; border: 1px solid #e2e8f0; border-radius: 7px;
       padding: 2.4mm 3mm 2.6mm; margin: 0 0 2.6mm; background: #fff; }
  .qh { display: flex; flex-wrap: wrap; gap: 2.5mm; font-size: 8.6pt; color: #475569;
        border-bottom: 1px dashed #cbd5e1; padding-bottom: 1.5mm; margin-bottom: 1.8mm; }
  .qh b { color: #0f172a; }
  .tag { background: #eff6ff; color: #1d4ed8; border-radius: 4px; padding: .4mm 1.6mm;
         font-weight: 600; letter-spacing: .02em; }
  .qt { margin-bottom: 1.6mm; }
  .fig { max-width: 100%; max-height: 68mm; display: block; margin: 1.6mm 0; }
  .opts { display: grid; grid-template-columns: 1fr 1fr; gap: .8mm 4mm; font-size: 9.9pt; }
  .op b { color: #1d4ed8; }
  .op.img { grid-column: 1 / -1; }
  .foot { margin-top: 6mm; font-size: 8.6pt; color: #94a3b8; text-align: center; }
  .bad { color: #b91c1c; font-weight: 700; }
</style></head><body>`);

  parts.push(`<h1>Daftar Soal CBT — ${esc(exam.title)}</h1>
<div class="muted">Pemetaan butir CBT ke naskah asli · dibuat ${new Date().toLocaleString("id-ID")}</div>
<table class="meta">
  <tr><td class="k">Token paket</td><td><b>${esc(spec.token)}</b></td>
      <td class="k">Jumlah soal</td><td><b>${rows.length}</b> butir</td></tr>
  <tr><td class="k">Durasi</td><td>${exam.durationMinutes} menit</td>
      <td class="k">Nilai lulus</td><td>${exam.passingScore}</td></tr>
  <tr><td class="k">Sumber naskah</td><td colspan="3">${spec.dir}/ — ${spec.sources
    .map((s) => esc(s.file))
    .join(", ")}</td></tr>
</table>
<p class="muted" style="font-size:9.4pt">Kolom <b>No. naskah</b> adalah nomor soal pada PDF asli
(yang dipakai kunci jawaban naskah), sehingga bisa dibuka langsung di file sumber tersebut.</p>`);

  for (const [subject, list] of grouped) {
    const info = sourceInfo.find((s) => s.subject === subject);
    const used = list.map((r) => r.srcNo).sort((a, b) => a - b);
    const notUsed = (info?.numbers || [])
      .filter((v, i, arr) => arr.indexOf(v) === i && !used.includes(v))
      .sort((a, b) => a - b);
    const dropped = (info?.allNumbers || [])
      .filter((v, i, arr) => arr.indexOf(v) === i && !(info?.numbers || []).includes(v))
      .sort((a, b) => a - b);
    parts.push(`<h2>${esc(subject)}</h2>`);
    parts.push(
      `<div class="nums">Naskah: <b>${esc(info?.file ?? "-")}</b> · terbaca di PDF:
       ${info?.parsed ?? "-"} butir · siap dipakai: ${info?.usable ?? "-"} ·
       <b>dipakai ${list.length}</b><br>
       Nomor naskah yang dipakai: <b>${used.join(", ")}</b><br>
       Tidak dipakai (siap pakai): <span class="muted">${notUsed.length ? notUsed.join(", ") : "—"}</span><br>
       Gugur saat build (tanpa kunci/opsi rusak): <span class="muted">${dropped.length ? dropped.join(", ") : "—"}</span></div>`,
    );
    for (const r of list) {
      const opts = ["A", "B", "C", "D", "E"]
        .map((L, i) => {
          const v = r.options[i];
          if (!v || !v.trim()) return "";
          const hasImg = /!\[[^\]]*\]\([^)]*\)/.test(v);
          return `<div class="op${hasImg ? " img" : ""}"><b>${L}.</b> ${mdToHtml(v)}</div>`;
        })
        .join("");
      parts.push(`<div class="q">
  <div class="qh">
    <span class="tag">No. CBT ${r.no}</span>
    <span>No. naskah <b>${r.srcNo}</b></span>
    <span>Kunci <b>${esc(r.key)}</b></span>
    ${r.status !== "OK" ? `<span class="bad">status ${r.status}</span>` : ""}
  </div>
  <div class="qt">${mdToHtml(r.text)}</div>
  <div class="opts">${opts}</div>
</div>`);
    }
  }

  parts.push(`<div class="foot">${esc(exam.title)} · ${spec.token} · ${rows.length} butir ·
dokumen otomatis, sumber data: database CBT &amp; naskah ${spec.dir}/</div></body></html>`);
  return parts.join("\n");
}

function buildCsv(pkg: Awaited<ReturnType<typeof buildPackage>>) {
  const head = [
    "No CBT",
    "Mapel",
    "No Naskah",
    "File Naskah",
    "Kunci",
    "Status Verifikasi",
    "Teks Soal",
    "Opsi A",
    "Opsi B",
    "Opsi C",
    "Opsi D",
    "Opsi E",
  ];
  const lines = [head.map(csvCell).join(";")];
  for (const r of pkg.rows) {
    lines.push(
      [
        String(r.no),
        r.subject,
        String(r.srcNo),
        r.file,
        r.key,
        r.status,
        r.text,
        r.options[0] || "",
        r.options[1] || "",
        r.options[2] || "",
        r.options[3] || "",
        r.options[4] || "",
      ]
        .map(csvCell)
        .join(";"),
    );
  }
  return "\ufeff" + lines.join("\r\n") + "\r\n";
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const prisma = new PrismaClient();
  const browser = await chromium.launch();
  const allProblems: string[] = [];

  try {
    for (const spec of PACKAGES) {
      console.log(`\n=== ${spec.title} (${spec.token})`);
      const pkg = await buildPackage(spec, prisma);
      allProblems.push(...pkg.problems.map((p) => `${spec.token}: ${p}`));

      const html = buildHtml(pkg);
      const htmlPath = path.join(OUT_DIR, `${spec.token}.html`);
      fs.writeFileSync(htmlPath, html, "utf8");

      const csvPath = path.join(OUT_DIR, `daftar-soal-${spec.token}.csv`);
      fs.writeFileSync(csvPath, buildCsv(pkg), "utf8");

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: "load", timeout: 120_000 });
      const pdfPath = path.join(OUT_DIR, `Laporan-Soal-${spec.token}.pdf`);
      await page.pdf({ path: pdfPath, printBackground: true, preferCSSPageSize: true });
      await page.close();

      const kb = (p: string) => `${Math.round(fs.statSync(p).size / 1024)} KB`;
      console.log(`  -> ${pdfPath} (${kb(pdfPath)})`);
      console.log(`  -> ${csvPath} (${kb(csvPath)})`);
    }
  } finally {
    await browser.close();
    await prisma.$disconnect();
  }

  console.log(
    allProblems.length
      ? `\nPERLU CEK (${allProblems.length}):\n  - ${allProblems.join("\n  - ")}`
      : "\nSEMUA TERVERIFIKASI — tidak ada selisih antara build dan database.",
  );
  if (allProblems.length) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
