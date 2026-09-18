import fs from 'fs';
import path from 'path';

const text = fs.readFileSync(path.join(process.cwd(), 'modul', 'Modul-MAN-IC-extracted.txt'), 'utf8');
const lines = text.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  // Cari baris yang mirip header bab / paket / tes
  if (
    /Mata Uji/i.test(line) ||
    /Paket\s*\d+/i.test(line) ||
    /Tes\s*Potensi/i.test(line) ||
    /Tes\s*Akademik/i.test(line) ||
    /TA\s*MAN/i.test(line) ||
    /Kemampuan/i.test(line) ||
    /Literasi/i.test(line) ||
    /Penalaran/i.test(line) ||
    /MATERI\s*UJIAN/i.test(line)
  ) {
    if (line.length < 80) {
      console.log(`L${i + 1}: ${line}`);
    }
  }
}

