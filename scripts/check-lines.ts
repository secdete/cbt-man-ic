import fs from 'fs';
import path from 'path';

const text = fs.readFileSync(path.join(process.cwd(), 'modul', 'Modul-MAN-IC-extracted.txt'), 'utf8');
const lines = text.split('\n');

console.log('Lines 460 - 480:');
for (let i = 460; i < 485; i++) {
  console.log(`L${i + 1}: ${lines[i]}`);
}

