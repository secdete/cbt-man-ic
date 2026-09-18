import fs from 'fs';
import path from 'path';

const text = fs.readFileSync(path.join(process.cwd(), 'modul', 'Modul-MAN-IC-extracted.txt'), 'utf8');
const lines = text.split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('-- 17 of 271 --')) {
    console.log(`Found -- 17 of 271 -- at line ${i + 1}`);
    const start = Math.max(0, i - 20);
    const end = Math.min(lines.length, i + 35);
    for (let j = start; j < end; j++) {
      console.log(`L${j + 1}: ${lines[j]}`);
    }
  }
}

