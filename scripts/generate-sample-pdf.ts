import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fs from 'fs';
import path from 'path';

async function generateSamplePdf() {
  const doc = await PDFDocument.create();
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);

  const outDir = path.join(__dirname, '..', 'sample-naskah');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Halaman 1
  let page = doc.addPage([595.28, 841.89]); // A4
  let y = 800;

  // Header
  page.drawText('NASKAH TRYOUT SELEKSI NASIONAL PESERTA DIDIK BARU (SNPDB)', {
    x: 50,
    y,
    size: 13,
    font: fontBold,
    color: rgb(0.05, 0.35, 0.25),
  });
  y -= 18;
  page.drawText('MADRASAH ALIYAH NEGERI INSAN CENDEKIA (MAN IC)', {
    x: 50,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  y -= 15;
  page.drawText('Mata Uji: Tes Potensi Skolastik (TPS) & Literasi Keagamaan | Waktu: 90 Menit', {
    x: 50,
    y,
    size: 9,
    font: fontRegular,
    color: rgb(0.4, 0.4, 0.4),
  });
  y -= 10;

  // Divider line
  page.drawLine({
    start: { x: 50, y },
    end: { x: 545, y },
    thickness: 1.5,
    color: rgb(0.05, 0.35, 0.25),
  });
  y -= 25;

  const questions = [
    {
      num: 1,
      q: 'Jika setiap siswa MAN Insan Cendekia disiplin dalam belajar dan rajin beribadah, maka prestasi akademik mereka akan cemerlang. Salman adalah siswa MAN Insan Cendekia yang berprestasi cemerlang.',
      opts: [
        'A. Salman pasti disiplin dalam belajar dan rajin beribadah.',
        'B. Salman belum tentu rajin beribadah.',
        'C. Salman hanya disiplin dalam belajar tetapi tidak beribadah.',
        'D. Disiplin belajar dan rajin ibadah merupakan salah satu faktor prestasi Salman.',
        'E. Semua siswa yang rajin beribadah pasti berprestasi cemerlang.',
      ],
      key: 'D',
      exp: 'Kekeliruan menafsirkan implikasi (affirming the consequent). Prestasi cemerlang adalah akibat, faktor penyebabnya salah satunya disiplin dan ibadah, namun bukan satu-satunya syarat mutlak.',
    },
    {
      num: 2,
      q: 'Dalam suatu laboratorium kimia MAN IC, larutan asam konsentrasi 40% sebanyak 6 liter dicampurkan dengan larutan asam konsentrasi 60% sebanyak 4 liter. Berapakah konsentrasi asam pada larutan campuran tersebut?',
      opts: [
        'A. 46%',
        'B. 48%',
        'C. 50%',
        'D. 52%',
        'E. 54%',
      ],
      key: 'B',
      exp: 'Total zat murni = (0.4 * 6) + (0.6 * 4) = 2.4 + 2.4 = 4.8 liter. Total volume = 6 + 4 = 10 liter. Konsentrasi = 4.8 / 10 = 48%.',
    },
    {
      num: 3,
      q: 'Karya monumental dalam bidang kedokteran "Al-Qanun fi at-Tibb" (The Canon of Medicine) yang menjadi rujukan dunia hingga berabad-abad ditulis oleh cendekiawan muslim bernama ...',
      opts: [
        'A. Ibnu Rusyd (Averroes)',
        'B. Al-Farabi (Alpharabius)',
        'C. Ibnu Sina (Avicenna)',
        'D. Al-Khawarizmi (Algoritmi)',
        'E. Jabir bin Hayyan (Geber)',
      ],
      key: 'C',
      exp: 'Karya The Canon of Medicine ditulis oleh Abu Ali al-Husain bin Abdullah bin Sina (Ibnu Sina).',
    },
    {
      num: 4,
      q: 'Nilai dari 125^(2/3) - 27^(1/3) + 16^(3/4) adalah ...',
      opts: [
        'A. 28',
        'B. 30',
        'C. 32',
        'D. 34',
        'E. 36',
      ],
      key: 'B',
      exp: '125^(2/3) = (5^3)^(2/3) = 25. 27^(1/3) = 3. 16^(3/4) = (2^4)^(3/4) = 8. Maka 25 - 3 + 8 = 30.',
    },
    {
      num: 5,
      q: 'Sikap toleransi dan saling menghormati perbedaan suku, agama, dan pandangan hidup dalam bingkai Islam rahmatan lil alamin dikenal dengan istilah ...',
      opts: [
        'A. Tawassuth',
        'B. Tasamuh',
        'C. Tawazun',
        'D. Ta\'adul',
        'E. Ta\'aruf',
      ],
      key: 'B',
      exp: 'Tasamuh adalah sikap toleransi dan kelapangan dada dalam menghormati perbedaan di masyarakat.',
    },
  ];

  for (const item of questions) {
    if (y < 120) {
      page = doc.addPage([595.28, 841.89]);
      y = 800;
    }

    // Question
    const qLine = `${item.num}. ${item.q}`;
    page.drawText(qLine.slice(0, 85), { x: 50, y, size: 9.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
    y -= 13;
    if (qLine.length > 85) {
      page.drawText(qLine.slice(85, 170), { x: 62, y, size: 9.5, font: fontBold, color: rgb(0.1, 0.1, 0.1) });
      y -= 13;
    }

    // Options
    for (const opt of item.opts) {
      page.drawText(opt, { x: 62, y, size: 9, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
      y -= 12;
    }

    // Key & Pembahasan
    page.drawText(`Kunci: ${item.key}`, { x: 62, y, size: 8.5, font: fontBold, color: rgb(0.05, 0.45, 0.3) });
    y -= 11;
    page.drawText(`Pembahasan: ${item.exp}`, { x: 62, y, size: 8, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    y -= 18;
  }

  const pdfBytes = await doc.save();
  const filePath = path.join(outDir, 'naskah-soal-man-ic.pdf');
  fs.writeFileSync(filePath, pdfBytes);

  // Juga simpan versi text agar bisa di-copy paste
  const textContent = questions.map((item) => {
    return `${item.num}. ${item.q}\n${item.opts.join('\n')}\nKunci: ${item.key}\nPembahasan: ${item.exp}\n`;
  }).join('\n');
  fs.writeFileSync(path.join(outDir, 'naskah-soal-man-ic.txt'), textContent, 'utf8');

  console.log(`✅ File contoh PDF berhasil dibuat di: ${filePath}`);
}

generateSamplePdf().catch(console.error);

