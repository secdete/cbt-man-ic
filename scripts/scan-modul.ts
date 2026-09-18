import fs from 'fs';
import path from 'path';

const text = fs.readFileSync(path.join(process.cwd(), 'modul', 'Modul-MAN-IC-extracted.txt'), 'utf8');

// Cari semua baris yang berisi MATERI UJIAN atau MATA UJI atau halaman
const lines = text.split('\n');

const subjectSections: { lineNo: number; text: string }[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (/MATA\s*UJI/i.test(line) || /MATERI\s*UJIAN/i.test(line) || /SUBTES/i.test(line) || /PAKET/i.test(line)) {
    subjectSections.push({ lineNo: i + 1, text: line });
  }
}

console.log(`Ditemukan ${subjectSections.length} baris judul materi/mata uji:`);
subjectSections.slice(0, 50).forEach((s) => console.log(`L${s.lineNo}: ${s.text}`));

// Hitung juga penanda halaman "-- X of 271 --"
const pages = lines.filter((l) => /--\s*\d+\s*of\s*\d+\s*--/i.test(l));
console.log(`Total penanda halaman: ${pages.length}`);

