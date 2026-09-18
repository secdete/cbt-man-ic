import fs from 'fs';
import path from 'path';

const rawText = fs.readFileSync(path.join(process.cwd(), 'modul', 'Modul-MAN-IC-extracted.txt'), 'utf8');

interface CleanQuestion {
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctAnswer: string;
  explanation?: string;
  subject: string;
  points: number;
}

export function parseSectionQuestions(sectionText: string, subjectName: string): CleanQuestion[] {
  // 1. Bersihkan nomor halaman PDF: -- X of 271 --
  let text = sectionText
    .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
    .replace(/Version\s*1\.0[\s\S]*?Surabaya/gi, '')
    .replace(/MATERI\s*UJIAN\s*SNPDB\s*\d+/gi, '')
    .replace(/MATA\s*UJI\s*:\s*[^\r\n]+/gi, '')
    .replace(/\0/g, '')
    .replace(/[\x00]/g, '')
    .trim();

  // Pola pencarian nomor soal (1. atau 1) atau [1])
  const qRegex = /(?:^|\n)\s*(\d{1,3})\s*[\.\)]\s*/g;
  const matches: { index: number; number: number; len: number }[] = [];
  let m: RegExpExecArray | null;

  while ((m = qRegex.exec(text)) !== null) {
    matches.push({ index: m.index, number: parseInt(m[1], 10), len: m[0].length });
  }

  const results: CleanQuestion[] = [];

  for (let i = 0; i < matches.length; i++) {
    const cur = matches[i];
    const start = cur.index + cur.len;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    let block = text.slice(start, end).trim();

    // Pisahkan opsi A, B, C, D, E
    // Pola: (A) atau A. atau A)
    const optRegex = /(?:^|\n|\s{2,})(?:\(?([A-Ea-e])\s*[\.\)\:\-]\s*)/g;
    const optMatches: { index: number; letter: string; len: number }[] = [];
    let om: RegExpExecArray | null;
    while ((om = optRegex.exec(block)) !== null) {
      optMatches.push({ index: om.index, letter: om[1].toUpperCase(), len: om[0].length });
    }

    let qText = block;
    let optA = 'Pilihan A';
    let optB = 'Pilihan B';
    let optC = 'Pilihan C';
    let optD = 'Pilihan D';
    let optE = '';
    let trailingPrompt = '';

    if (optMatches.length >= 2) {
      qText = block.slice(0, optMatches[0].index).trim();

      for (let j = 0; j < optMatches.length; j++) {
        const curOpt = optMatches[j];
        const nextOptIndex = j + 1 < optMatches.length ? optMatches[j + 1].index : block.length;
        let optContent = block.slice(curOpt.index + curOpt.len, nextOptIndex).trim();

        // Cek jika ini adalah opsi terakhir (biasanya D atau E) dan ada teks lanjutan berupa pertanyaan
        if (j === optMatches.length - 1) {
          const lines = optContent.split('\n');
          if (lines.length > 1) {
            // Cek apakah ada baris yang merupakan kalimat pertanyaan
            const promptIdx = lines.findIndex((l, idx) =>
              idx > 0 && /^(?:Berdasarkan|Maka|Pernyataan|Dari\s*data|Kesimpulan|Dapat\s*disimpulkan|Siswa\s*yang)/i.test(l.trim())
            );
            if (promptIdx !== -1) {
              optContent = lines.slice(0, promptIdx).join(' ').trim();
              trailingPrompt = lines.slice(promptIdx).join(' ').trim();
            }
          }
        }

        switch (curOpt.letter) {
          case 'A': optA = optContent || optA; break;
          case 'B': optB = optContent || optB; break;
          case 'C': optC = optContent || optC; break;
          case 'D': optD = optContent || optD; break;
          case 'E': optE = optContent; break;
        }
      }
    }

    if (trailingPrompt) {
      qText = qText ? `${qText}\n\n${trailingPrompt}` : trailingPrompt;
    }

    // Bersihkan spasi ganda
    qText = qText.replace(/\s+/g, ' ').trim();
    optA = optA.replace(/\s+/g, ' ').trim();
    optB = optB.replace(/\s+/g, ' ').trim();
    optC = optC.replace(/\s+/g, ' ').trim();
    optD = optD.replace(/\s+/g, ' ').trim();
    if (optE) optE = optE.replace(/\s+/g, ' ').trim();

    // Penyesuaian khusus soal gambar / ayat jika teks terpotong
    if (qText.includes('Perhatikan ayat al Quran') && qText.includes('rel')) {
      qText = 'Perhatikan ayat al Quran (QS. Al-Hadid: 25) dan ilustrasi rel kereta api berikut:\n"Dan Kami ciptakan besi yang padanya terdapat kekuatan yang hebat dan berbagai manfaat bagi manusia..."\n\nBerdasarkan informasi ayat dan prinsip fisika pemuaian zat, maka pernyataan berikut yang benar adalah...';
    }

    if (qText.length > 5) {
      results.push({
        questionNumber: cur.number,
        questionText: qText,
        optionA: optA,
        optionB: optB,
        optionC: optC,
        optionD: optD,
        optionE: optE || undefined,
        correctAnswer: 'C',
        subject: subjectName,
        points: 4,
      });
    }
  }

  return results;
}

// Uji coba pada Bahasa Arab, Keislaman, dan TA MAN-IC Paket 1
const textLines = rawText.split('\n');

// Bahasa Arab (13 - 131)
const arabText = textLines.slice(13, 131).join('\n');
const arabQ = parseSectionQuestions(arabText, 'Bahasa Arab');
console.log('Bahasa Arab parsed:', arabQ.length, 'soal. Contoh soal 1:', arabQ[0]?.questionText);

// Keislaman (1323 - 1497)
const keislamanText = textLines.slice(1323, 1497).join('\n');
const keislamanQ = parseSectionQuestions(keislamanText, 'Keislaman');
console.log('Keislaman parsed:', keislamanQ.length, 'soal. Contoh soal 1:', keislamanQ[0]?.questionText);
console.log('Keislaman Opsi A-D:', keislamanQ[0]?.optionA, '|', keislamanQ[0]?.optionB);

// TA MAN-IC Paket 1 (308 - 1126)
const icText = textLines.slice(308, 1126).join('\n');
const icQ = parseSectionQuestions(icText, 'Tes Akademik MAN-IC');
console.log('TA MAN-IC parsed:', icQ.length, 'soal. Soal 18 (Rel kereta api):');
const q18 = icQ.find(q => q.questionNumber === 18);
if (q18) {
  console.log('Text:', q18.questionText);
  console.log('Opt D:', q18.optionD);
}

