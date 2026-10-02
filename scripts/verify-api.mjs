/**
 * Regresi ekstraksi lewat HTTP: `npm run verify:api` (butuh server jalan).
 *
 * Menguji jalur sebenarnya yang dipakai admin — login, unggah multipart ke
 * /api/exams/parse-pdf, sampai jumlah soal & gambar di respons — bukan hanya
 * pemanggilan pustaka secara langsung.
 */
import fs from "fs";
import path from "path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const EXPECTED = {
  "Bahasa Arab 2-4.pdf": 15,
  "Bahasa Indonesia 5-6.pdf": 10,
  "Bahasa Inggris 7-10.pdf": 15,
  "IPA 44-48.pdf": 13,
  "IPS 49-53.pdf": 13,
  "Keislaman 54-61.pdf": 22,
  "Kemampuan Analitik 266-271.pdf": 20,
  "Matematika 62-67.pdf": 15,
  "TA MAN-IC Paket 1 11-43.pdf": 80,
  "TA MAN-PK Paket 1 68-97.pdf": 70,
  "Tes Akademik Ipa 182-210.pdf": 75,
  "Tes Akademik Ipa 98-126.pdf": 75,
  "Tes Akademik Ips 127-156.pdf": 75,
  "Tes Akademik Ips 211-240.pdf": 75,
  "Tes Keislaman 157-181.pdf": 70,
  "Tes Keislaman 241-265.pdf": 70,
};

async function main() {
  const login = await fetch(`${BASE}/api/admin/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "admin", password: "admin123" }),
  });
  const cookie = (login.headers.get("set-cookie") || "").split(";")[0];
  const loginJson = await login.json();
  if (!loginJson.success) {
    console.error("LOGIN GAGAL", loginJson);
    process.exit(1);
  }

  const only = process.argv.slice(2);
  const files = fs
    .readdirSync("modul")
    .filter((f) => f.toLowerCase().endsWith(".pdf"))
    .filter((f) => only.length === 0 || only.includes(f));

  let fail = 0;
  let totalQuestions = 0;
  let totalImages = 0;
  let totalJpeg = 0;
  let totalPng = 0;

  for (const file of files) {
    const started = Date.now();
    const form = new FormData();
    const bytes = fs.readFileSync(path.resolve(process.cwd(), "modul", file));
    form.append("file", new Blob([bytes], { type: "application/pdf" }), file);

    const res = await fetch(`${BASE}/api/exams/parse-pdf`, {
      method: "POST",
      headers: { Cookie: cookie },
      body: form,
    });
    const json = await res.json();
    const ms = Date.now() - started;

    if (!res.ok || !json.success) {
      fail++;
      console.log(`${file} -> HTTP ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
      continue;
    }

    const got = json.totalQuestionsParsed;
    const expected = EXPECTED[file];
    const ok = expected === undefined || got === expected;
    if (!ok) fail++;
    const strJson = JSON.stringify(json.questions);
    const imgInQuestions = (strJson.match(/!\[[^\]]*\]\(data:image\//g) || []).length;
    const jpegCount = (strJson.match(/data:image\/jpeg/g) || []).length;
    const pngCount = (strJson.match(/data:image\/png/g) || []).length;
    totalQuestions += got;
    totalImages += json.imageCount ?? 0;
    totalJpeg += jpegCount;
    totalPng += pngCount;

    console.log(
      `${ok ? "OK  " : "FAIL"} ${file.padEnd(40)} soal=${got}/${expected ?? "?"} gambar=${json.imageCount} (di soal=${imgInQuestions}, jpeg=${jpegCount} png=${pngCount}) metode=${json.strategy} ${ms}ms res=${Math.round(strJson.length / 1024)}KB`,
    );
    for (const w of json.warnings || []) console.log(`       ⚠ ${w}`);
    for (const n of json.notes || []) console.log(`       ℹ ${n}`);
  }

  console.log(
    `\nTOTAL ${totalQuestions} soal, ${totalImages} gambar (jpeg=${totalJpeg}, png=${totalPng}), gagal=${fail}`,
  );
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
