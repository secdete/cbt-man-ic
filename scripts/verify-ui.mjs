/**
 * Pemeriksaan tampilan panel admin lewat Chromium: `npm run verify:ui`
 * (butuh server jalan, `npm start`).
 *
 * Menguji alur yang benar-benar dipakai panitia: login → unggah naskah PDF ke
 * /admin/exams/create → ekstrak → pastikan hasilnya tampil sebagai gambar dan
 * pratinjau tampilan peserta, bukan markdown base64 di kolom teks. Tangkapan
 * layar disimpan ke tmp-ui/ untuk ditinjau.
 *
 * Pilihan naskah & folder hasil lewat variabel lingkungan:
 *   SAMPLE_PDF="modul/TA MAN-PK Paket 1 68-97.pdf" OUT_DIR=tmp-ui2 npm run verify:ui
 */
import fs from "fs";
import path from "path";
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.OUT_DIR || "tmp-ui";
const USER = process.env.ADMIN_USER || "admin";
const PASS = process.env.ADMIN_PASS || "admin123";
const SAMPLE = path.resolve(
  process.cwd(),
  process.env.SAMPLE_PDF || path.join("modul", "IPA 44-48.pdf"),
);

let fail = 0;
const check = (cond, label, extra = "") => {
  if (cond) console.log(`PASS  ${label}`);
  else {
    fail++;
    console.log(`FAIL  ${label}${extra ? ` -> ${extra}` : ""}`);
  }
};

async function shot(page, name, fullPage = false) {
  const file = path.join(OUT, name);
  await page.screenshot({ path: file, fullPage });
  return file;
}

async function main() {
  if (!fs.existsSync(SAMPLE)) {
    console.log(`FAIL  contoh naskah tidak ada: ${SAMPLE}`);
    process.exit(1);
  }
  // Bersihkan sisa run sebelumnya supaya tidak ada tangkapan layar basi.
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  console.log(`naskah : ${path.relative(process.cwd(), SAMPLE)}\n`);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const consoleErrors = [];
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });

  try {
    /* ------------------------------------------------- 1. login panitia */
    await page.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
    await shot(page, "01-login.png");
    await page.locator('form input[type="text"]').first().fill(USER);
    await page.locator('form input[type="password"]').first().fill(PASS);
    await page.locator('form button[type="submit"]').click();
    await page.waitForURL((u) => !u.pathname.includes("/admin/login"), {
      timeout: 20000,
    });
    await page.waitForLoadState("networkidle");
    check(
      true,
      `login sebagai "${USER}" lalu diarahkan ke ${new URL(page.url()).pathname}`,
    );
    await shot(page, "02-dashboard.png", true);

    /* ------------------------------------- 2. unggah naskah PDF & ekstrak */
    await page.goto(`${BASE}/admin/exams/create`, { waitUntil: "networkidle" });
    await shot(page, "03-create-kosong.png", true);

    await page.setInputFiles("#pdf-upload", SAMPLE);
    const extractBtn = page.getByRole("button", {
      name: /Proses & Ekstrak Soal Otomatis/,
    });
    check(
      await extractBtn.isEnabled(),
      "tombol ekstrak aktif setelah berkas dipilih",
    );
    await extractBtn.click();

    const BANNER = "text=/Berhasil mengekstrak \\d+ butir soal/";
    await page.waitForSelector(BANNER, { timeout: 180000 });
    await page.waitForLoadState("networkidle");

    const message = await page.locator(BANNER).first().innerText();
    const claimed = Number(message.match(/(\d+) butir soal/)?.[1] || 0);
    check(claimed > 0, "ekstraksi menghasilkan butir soal", message.trim());

    /* --------------------------------------------- 3. hasil di layar */
    const cards = await page
      .locator('label:has-text("Teks Pertanyaan Soal:")')
      .count();
    check(cards === claimed, `${claimed} kartu butir soal dirender`, `kartu=${cards}`);

    // Pratinjau hanya muncul untuk soal yang benar-benar berisi gambar.
    const previews = await page.locator("text=Pratinjau tampilan peserta").count();
    const previewImgs = await page.locator('img[src^="data:image/"]').count();
    check(previews > 0, "pratinjau tampilan peserta tampil", `pratinjau=${previews}`);
    check(
      previewImgs >= previews,
      "gambar tampil sebagai <img>, bukan teks",
      `img=${previewImgs}`,
    );

    // Kolom edit tidak boleh memuat markdown base64 sama sekali.
    const fields = await page.evaluate(() =>
      Array.from(document.querySelectorAll("textarea, input[type='text']")).map(
        (el) => el.value,
      ),
    );
    const base64Fields = fields.filter((v) => v.includes("data:image"));
    check(
      base64Fields.length === 0,
      "kolom edit bersih dari markdown base64",
      `${base64Fields.length} kolom masih memuat base64`,
    );

    const withMarker = fields.filter((v) => /‹gambar \d+›/.test(v)).length;
    check(withMarker > 0, "penanda ‹gambar n› dipakai di kolom edit", `penanda=${withMarker}`);

    // Soal yang gambarnya ada di badan soal wajib punya pratinjau. Soal dengan
    // gambar khusus opsi juga ikut tampil, jadi ini batas bawah — bukan sama
    // persis, karena satu field opsi pun boleh memuat penanda.
    const stemsWithMarker = await page.evaluate(() =>
      Array.from(document.querySelectorAll("label"))
        .filter((l) => (l.textContent || "").includes("Teks Pertanyaan Soal:"))
        .filter((l) => {
          const ta = l.parentElement?.querySelector("textarea");
          return (
            !!ta &&
            !!(l.compareDocumentPosition(ta) & Node.DOCUMENT_POSITION_FOLLOWING) &&
            /‹gambar \d+›/.test(ta.value)
          );
        }).length,
    );
    check(
      previews >= stemsWithMarker && previews <= claimed,
      "pratinjau muncul untuk tiap soal bergambar",
      `pratinjau=${previews} badan=${stemsWithMarker} total=${claimed}`,
    );

    // Panel rincian ekstraksi (jumlah halaman/strategi/catatan).
    const detailRows = await page
      .locator("text=/halaman|strategi|gambar|metode/i")
      .count();
    check(detailRows > 0, "panel rincian ekstraksi ikut tampil", `baris=${detailRows}`);

    // Tangkap per-bagian: halaman hasil bisa belasan ribu piksel tingginya.
    const banner = page.locator(BANNER).first();
    await banner.scrollIntoViewIfNeeded();
    await page.evaluate(() => window.scrollBy(0, -260));
    await shot(page, "04-hasil-ekstraksi.png");
    await page.screenshot({
      path: path.join(OUT, "04b-hasil-ekstraksi-panjang.png"),
      fullPage: true,
    });

    // Fokus ke satu butir bergambar untuk peninjauan visual.
    const firstCard = page
      .locator('label:has-text("Teks Pertanyaan Soal:")')
      .first();
    await firstCard.scrollIntoViewIfNeeded();
    const box = await firstCard.evaluate((el) => {
      const card = el.closest("div.rounded-2xl") || el.parentElement;
      const r = card.getBoundingClientRect();
      return {
        x: Math.max(0, r.x - 8),
        y: Math.max(0, r.y + window.scrollY - 8),
        width: Math.min(r.width + 16, 1440),
        height: Math.min(r.height + 16, 1400),
      };
    });
    await page.screenshot({
      path: path.join(OUT, "05-butir-bergambar.png"),
      clip: box,
      fullPage: true,
    });

    /* ------------------------------------------- 4. tampilan dashboard */
    await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
    await shot(page, "06-dashboard-atas.png");
    await shot(page, "06b-dashboard-panjang.png", true);

    // Tiap bagian ditangkap terpisah agar teksnya masih terbaca.
    for (const [file, label] of [
      ["07-paket-uian.png", "Daftar Paket Ujian"],
      ["08-kelola-peserta.png", "Kelola Peserta Ujian"],
    ]) {
      const heading = page
        .getByRole("heading", { name: new RegExp(label) })
        .first();
      if ((await heading.count()) === 0) {
        console.log(`CATAT  judul "${label}" tidak ditemukan`);
        continue;
      }
      await heading.scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, -24));
      await shot(page, file);
    }

    const realErrors = consoleErrors.filter(
      (e) => !e.includes("Failed to load resource") && !e.includes("401"),
    );
    check(
      realErrors.length === 0,
      "tanpa galat konsol yang berarti",
      realErrors.slice(0, 3).join(" | "),
    );
  } catch (error) {
    fail++;
    console.log(`FAIL  alur terputus -> ${error.message}`);
    await shot(page, "99-gagal.png", true).catch(() => {});
  } finally {
    await browser.close();
  }

  console.log(
    `\nRINGKASAN: ${fail === 0 ? "semua lulus" : `${fail} gagal`} (tangkapan di ${OUT}/)`,
  );
  process.exit(fail > 0 ? 1 : 0);
}

main();
