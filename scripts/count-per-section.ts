import fs from 'fs';
import path from 'path';
import { parseQuestionsFromText } from '../lib/pdf-parser';

const text = fs.readFileSync(path.join(process.cwd(), 'modul', 'Modul-MAN-IC-extracted.txt'), 'utf8');
const lines = text.split('\n');

interface Section {
  name: string;
  startLine: number;
}

const sectionHeaders = [
  { name: 'Mata Uji : Bahasa Arab', start: 13 },
  { name: 'Mata Uji : Bahasa Indonesia', start: 131 },
  { name: 'Mata Uji : Bahasa Inggris', start: 200 },
  { name: 'Mata Uji : TA MAN-IC Paket 1', start: 308 },
  { name: 'Mata Uji : IPA', start: 1126 },
  { name: 'Mata Uji : IPS', start: 1228 },
  { name: 'Mata Uji : Keislaman', start: 1323 },
  { name: 'Mata Uji : Matematika', start: 1497 },
  { name: 'Mata Uji : TA MAN-PK Paket 1', start: 1620 },
  { name: 'Mata Uji : Tes Akademik IPA (Paket 1)', start: 2270 },
  { name: 'Mata Uji : Tes Akademik IPS (Paket 1)', start: 3130 },
  { name: 'Mata Uji : Tes Akademik IPA (Paket 2)', start: 4805 },
  { name: 'Mata Uji : Tes Akademik IPS (Paket 2)', start: 5662 },
  { name: 'Mata Uji : Kemampuan Analitik', start: 7248 },
];

for (let i = 0; i < sectionHeaders.length; i++) {
  const current = sectionHeaders[i];
  const nextStart = i + 1 < sectionHeaders.length ? sectionHeaders[i + 1].start : lines.length;
  
  // Ambil teks bagian ini
  let secText = lines.slice(current.start, nextStart).join('\n');
  
  // Bersihkan penanda halaman: -- X of 271 --
  secText = secText.replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '');

  const questions = parseQuestionsFromText(secText);
  console.log(`[${i + 1}] ${current.name} -> Ditemukan ${questions.length} butir soal (Baris ${current.start} - ${nextStart})`);
}

