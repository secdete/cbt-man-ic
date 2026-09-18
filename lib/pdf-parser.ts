export interface ParsedQuestion {
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE?: string;
  correctAnswer: string;
  explanation?: string;
  subject?: string;
  points?: number;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfModule = require("pdf-parse");
    if (typeof pdfModule === "function") {
      const data = await pdfModule(buffer);
      return data.text || "";
    } else if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
      return result.text || "";
    } else {
      throw new Error("Format library pdf-parse tidak dikenali.");
    }
  } catch (error: any) {
    console.error("Gagal mengekstrak teks PDF:", error);
    throw new Error(
      `Ekstraksi PDF gagal: ${error?.message || "Error tidak diketahui"}`,
    );
  }
}

/**
 * Parsing teks ujian menjadi butir-butir soal terstruktur (Nomor, Soal, Opsi A-E, Kunci, Pembahasan)
 */
export function parseQuestionsFromText(rawText: string): ParsedQuestion[] {
  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  // Bersihkan karakter aneh, null bytes, dan standarisasi baris baru
  const cleanText = rawText
    .replace(/\0/g, "")
    .replace(/[\x00]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .trim();

  // 1. Cek apakah ada tabel/daftar kunci jawaban di bagian akhir dokumen
  const bottomKeysMap = new Map<number, string>();
  const keySectionRegex =
    /(?:kunci\s*jawaban|daftar\s*kunci|kunci\s*soal)[\s\S]*$/i;
  const keyMatch = cleanText.match(keySectionRegex);
  if (keyMatch) {
    const keySectionText = keyMatch[0];
    const itemKeyRegex = /(?:(\d+)\s*[\.\:\-\)]\s*([A-Ea-e]))/g;
    let ikm: RegExpExecArray | null;
    while ((ikm = itemKeyRegex.exec(keySectionText)) !== null) {
      const qNum = parseInt(ikm[1], 10);
      const qAns = ikm[2].toUpperCase();
      bottomKeysMap.set(qNum, qAns);
    }
  }

  // 2. Pisahkan teks soal berdasarkan nomor soal di awal baris (misal: "1. ", "1) ", "Soal 1. ", dll)
  // Membagi teks dengan lookahead regex
  const questionBlocks: { number: number; text: string }[] = [];

  // Regex mendeteksi awal soal: misal "\n1. " atau awal teks "1. "
  const questionHeaderRegex =
    /(?:^|\n)\s*(?:soal\s*(?:nomor|no)?\.?\s*)?(\d+)\s*[\.\)\-]\s+/gi;

  const matches: { index: number; number: number; length: number }[] = [];
  let match: RegExpExecArray | null;
  while ((match = questionHeaderRegex.exec(cleanText)) !== null) {
    matches.push({
      index: match.index,
      number: parseInt(match[1], 10),
      length: match[0].length,
    });
  }

  if (matches.length === 0) {
    // Jika tidak ditemukan penomoran baku, coba parsing baris demi baris
    return fallbackParser(cleanText);
  }

  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const startIndex = current.index + current.length;
    const endIndex =
      i + 1 < matches.length
        ? matches[i + 1].index
        : keyMatch
          ? keyMatch.index
          : cleanText.length;
    const blockContent = cleanText.slice(startIndex, endIndex).trim();

    questionBlocks.push({
      number: current.number,
      text: blockContent,
    });
  }

  const results: ParsedQuestion[] = [];

  for (const block of questionBlocks) {
    const parsed = parseSingleQuestionBlock(
      block.number,
      block.text,
      bottomKeysMap.get(block.number),
    );
    if (parsed) {
      results.push(parsed);
    }
  }

  return results;
}

function parseSingleQuestionBlock(
  questionNumber: number,
  blockText: string,
  bottomKey?: string,
): ParsedQuestion | null {
  // Pisahkan pembahasan bila ada
  let mainText = blockText;
  let explanation = "";
  const explMatch = mainText.match(
    /(?:pembahasan|penjelasan|alasan)\s*[\:\-]\s*([\s\S]+)$/i,
  );
  if (explMatch) {
    explanation = explMatch[1].trim();
    mainText = mainText.slice(0, explMatch.index).trim();
  }

  // Pisahkan kunci jawaban inline bila ada
  let inlineKey = "";
  const keyMatch = mainText.match(
    /(?:kunci|jawaban|kunci\s*jawaban)\s*[\:\-]\s*([A-Ea-e])/i,
  );
  if (keyMatch) {
    inlineKey = keyMatch[1].toUpperCase();
    mainText = mainText.slice(0, keyMatch.index).trim();
  }

  // Deteksi letak opsi A, B, C, D, E
  // Pola: baris baru atau spasi diikuti "A. ", "B. ", "C. ", "D. ", "E. " atau "(A)", "(B)", dll.
  const optionRegex = /(?:^|\n|\s{2,})(?:\(?([A-Ea-e])\s*[\.\)\:\-]\s*)/g;
  const optMatches: { index: number; letter: string; matchLength: number }[] =
    [];

  let optMatch: RegExpExecArray | null;
  while ((optMatch = optionRegex.exec(mainText)) !== null) {
    optMatches.push({
      index: optMatch.index,
      letter: optMatch[1].toUpperCase(),
      matchLength: optMatch[0].length,
    });
  }

  let questionText = mainText;
  let optA = "";
  let optB = "";
  let optC = "";
  let optD = "";
  let optE = "";

  if (optMatches.length >= 2) {
    // Potong teks pertanyaan dari awal hingga opsi pertama ditemukan
    questionText = mainText.slice(0, optMatches[0].index).trim();

    for (let j = 0; j < optMatches.length; j++) {
      const cur = optMatches[j];
      const nextIndex =
        j + 1 < optMatches.length ? optMatches[j + 1].index : mainText.length;
      const optContent = mainText
        .slice(cur.index + cur.matchLength, nextIndex)
        .trim();

      switch (cur.letter) {
        case "A":
          optA = optContent;
          break;
        case "B":
          optB = optContent;
          break;
        case "C":
          optC = optContent;
          break;
        case "D":
          optD = optContent;
          break;
        case "E":
          optE = optContent;
          break;
      }
    }
  }

  // Tentukan kunci jawaban prioritas: inlineKey > bottomKey > default 'A'
  const finalKey = (inlineKey || bottomKey || "A").toUpperCase();

  // Validasi minimal ada pertanyaan dan opsi
  if (!questionText && !optA) {
    return null;
  }

  return {
    questionNumber,
    questionText: questionText || `Soal nomor ${questionNumber}`,
    optionA: optA || "Pilihan A",
    optionB: optB || "Pilihan B",
    optionC: optC || "Pilihan C",
    optionD: optD || "Pilihan D",
    optionE: optE || undefined,
    correctAnswer: ["A", "B", "C", "D", "E"].includes(finalKey)
      ? finalKey
      : "A",
    explanation: explanation || undefined,
    points: 4,
    subject: detectSubject(questionText),
  };
}

function detectSubject(text: string): string {
  const t = text.toLowerCase();
  if (
    t.includes("hitung") ||
    t.includes("matematika") ||
    t.includes("segitiga") ||
    t.includes("lingkaran") ||
    t.includes("persamaan") ||
    t.includes("fungsi") ||
    t.includes("x =") ||
    t.includes("bilangan") ||
    t.includes("rata-rata") ||
    t.includes("peluang") ||
    t.includes("sudut") ||
    t.includes("akar") ||
    t.includes("pecahan")
  ) {
    return "Penalaran Matematika";
  }
  if (
    t.includes("energi") ||
    t.includes("gaya") ||
    t.includes("kecepatan") ||
    t.includes("massa") ||
    t.includes("sel") ||
    t.includes("organ") ||
    t.includes("fotosintesis") ||
    t.includes("atom") ||
    t.includes("molekul") ||
    t.includes("senyawa") ||
    t.includes("larutan") ||
    t.includes("ekosistem") ||
    t.includes("gravitasi") ||
    t.includes("hukum newton")
  ) {
    return "Literasi Sains (IPA)";
  }
  if (
    t.includes("surah") ||
    t.includes("ayat") ||
    t.includes("hadis") ||
    t.includes("hadits") ||
    t.includes("zakat") ||
    t.includes("sholat") ||
    t.includes("shalat") ||
    t.includes("nabi") ||
    t.includes("rasul") ||
    t.includes("islam") ||
    t.includes("fikih") ||
    t.includes("akidah") ||
    t.includes("baitul hikmah") ||
    t.includes("khalifah") ||
    t.includes("quran") ||
    t.includes("tajwid")
  ) {
    return "Literasi Keagamaan Islam";
  }
  if (
    t.includes("which") ||
    t.includes("the following") ||
    t.includes("passage") ||
    t.includes("according to") ||
    t.includes("the author") ||
    t.includes("the text") ||
    t.includes("meaning of") ||
    t.includes("sentence") ||
    t.includes("paragraph")
  ) {
    return "Literasi Bahasa Inggris";
  }
  if (
    t.includes("paragraf") ||
    t.includes("ide pokok") ||
    t.includes("kalimat utama") ||
    t.includes("bacaan") ||
    t.includes("kesimpulan") ||
    t.includes("simpulan") ||
    t.includes("ejaan") ||
    t.includes("konjungsi") ||
    t.includes("antonim") ||
    t.includes("sinonim") ||
    t.includes("puisi") ||
    t.includes("teks di atas")
  ) {
    return "Literasi Bahasa Indonesia";
  }
  if (
    t.includes("jika semua") ||
    t.includes("maka kesimpulannya") ||
    t.includes("urutan") ||
    t.includes("analogi") ||
    t.includes("pola") ||
    t.includes("deret") ||
    t.includes("silogisme")
  ) {
    return "Penalaran Logika";
  }
  return "Tes Potensi Skolastik";
}

function fallbackParser(text: string): ParsedQuestion[] {
  // Jika tidak beraturan, buat 1 soal dari teks yang ada agar admin bisa merevisi
  return [
    {
      questionNumber: 1,
      questionText: text.slice(0, 300),
      optionA: "Opsi A",
      optionB: "Opsi B",
      optionC: "Opsi C",
      optionD: "Opsi D",
      optionE: "Opsi E",
      correctAnswer: "A",
      explanation: "Silakan periksa teks naskah pada editor.",
      points: 4,
      subject: "Umum",
    },
  ];
}
