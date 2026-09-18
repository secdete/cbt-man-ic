import fs from "fs";
import path from "path";

const text = fs.readFileSync(
  path.join(process.cwd(), "modul", "Modul-MAN-IC-extracted.txt"),
  "utf8",
);

// Pisahkan teks per halaman berdasarkan penanda: -- X of 271 --
const pageRegex = /--\s*(\d+)\s*of\s*271\s*--/gi;
let m;
const pageIndices: { page: number; index: number }[] = [];

while ((m = pageRegex.exec(text)) !== null) {
  pageIndices.push({ page: parseInt(m[1], 10), index: m.index });
}

console.log(`Ditemukan ${pageIndices.length} halaman dalam modul.`);

const pageSummaries: { page: number; header: string }[] = [];

for (let i = 0; i < pageIndices.length; i++) {
  const cur = pageIndices[i];
  const nextIdx =
    i + 1 < pageIndices.length ? pageIndices[i + 1].index : text.length;
  const pageText = text.slice(cur.index, nextIdx).trim();

  // Ambil 3 baris pertama halaman untuk melihat judul/header
  const firstLines = pageText
    .split("\n")
    .slice(0, 4)
    .map((l) => l.trim())
    .filter(Boolean)
    .join(" | ");
  pageSummaries.push({ page: cur.page, header: firstLines.slice(0, 100) });
}

// Tampilkan halaman-halaman yang memuat pergantian bab / mata uji
console.log("\nRingkasan Header tiap rentang halaman:");
for (let p = 0; p < pageSummaries.length; p += 10) {
  const item = pageSummaries[p];
  console.log(`Hal ${item.page}: ${item.header}`);
}
