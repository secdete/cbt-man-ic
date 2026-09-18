import fs from 'fs';
import path from 'path';

const text = fs.readFileSync(path.join(process.cwd(), 'modul', 'Modul-MAN-IC-extracted.txt'), 'utf8');
const lines = text.split('\n');

interface Section {
  name: string;
  startLine: number;
}

const sections: Section[] = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  let foundName = '';

  if (/MATA\s*UJI\s*:\s*(.+)/i.test(line)) {
    foundName = line.replace(/MATA\s*UJI\s*:\s*/i, '').trim();
  } else if (/Mata\s*Uji\s*:\s*(.+)/i.test(line)) {
    foundName = line.replace(/Mata\s*Uji\s*:\s*/i, '').trim();
  } else if (/^Tes\s*Akademik\s+(.+)/i.test(line)) {
    foundName = line.trim();
  }

  if (foundName) {
    sections.push({ name: foundName, startLine: i + 1 });
  }
}

console.log('Daftar Bagian / Mata Uji Asli dalam Dokumen:');
sections.forEach((sec, idx) => {
  const nextLine = idx + 1 < sections.length ? sections[idx + 1].startLine : lines.length;
  const lineCount = nextLine - sec.startLine;
  console.log(`${idx + 1}. "${sec.name}" (Baris ${sec.startLine} - ${nextLine}, total ${lineCount} baris)`);
});

