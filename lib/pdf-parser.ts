import zlib from "zlib";

// Polyfills for browser-only globals required by pdf-parse v2 / pdfjs-dist in Node.js / Vercel Serverless
if (typeof (globalThis as any).DOMMatrix === "undefined") {
  class DOMMatrixPolyfill {
    a = 1;
    b = 0;
    c = 0;
    d = 1;
    e = 0;
    f = 0;
    m11 = 1;
    m12 = 0;
    m13 = 0;
    m14 = 0;
    m21 = 0;
    m22 = 1;
    m23 = 0;
    m24 = 0;
    m31 = 0;
    m32 = 0;
    m33 = 1;
    m34 = 0;
    m41 = 0;
    m42 = 0;
    m43 = 0;
    m44 = 1;
    is2D = true;
    isIdentity = true;

    constructor(init?: any) {
      if (Array.isArray(init) || (init && typeof init.length === "number")) {
        if (init.length === 6) {
          this.a = this.m11 = init[0] ?? 1;
          this.b = this.m12 = init[1] ?? 0;
          this.c = this.m21 = init[2] ?? 0;
          this.d = this.m22 = init[3] ?? 1;
          this.e = this.m41 = init[4] ?? 0;
          this.f = this.m42 = init[5] ?? 0;
          this.is2D = true;
        } else if (init.length === 16) {
          this.m11 = init[0];
          this.m12 = init[1];
          this.m13 = init[2];
          this.m14 = init[3];
          this.m21 = init[4];
          this.m22 = init[5];
          this.m23 = init[6];
          this.m24 = init[7];
          this.m31 = init[8];
          this.m32 = init[9];
          this.m33 = init[10];
          this.m34 = init[11];
          this.m41 = init[12];
          this.m42 = init[13];
          this.m43 = init[14];
          this.m44 = init[15];
          this.a = this.m11;
          this.b = this.m12;
          this.c = this.m21;
          this.d = this.m22;
          this.e = this.m41;
          this.f = this.m42;
          this.is2D = false;
        }
      }
    }

    multiply(other: any) {
      return this;
    }
    preMultiplySelf(other: any) {
      return this;
    }
    multiplySelf(other: any) {
      return this;
    }
    inverse() {
      return this;
    }
    invertSelf() {
      return this;
    }
    translate(tx = 0, ty = 0, tz = 0) {
      return this;
    }
    translateSelf(tx = 0, ty = 0, tz = 0) {
      return this;
    }
    scale(sx = 1, sy = 1, sz = 1) {
      return this;
    }
    scaleSelf(sx = 1, sy = 1, sz = 1) {
      return this;
    }
    rotate(angle = 0) {
      return this;
    }
    rotateSelf(angle = 0) {
      return this;
    }
    transformPoint(point: any) {
      const x = point?.x ?? 0;
      const y = point?.y ?? 0;
      return {
        x: this.a * x + this.c * y + this.e,
        y: this.b * x + this.d * y + this.f,
        z: point?.z ?? 0,
        w: point?.w ?? 1,
      };
    }
    toFloat32Array() {
      return new Float32Array([
        this.m11,
        this.m12,
        this.m13,
        this.m14,
        this.m21,
        this.m22,
        this.m23,
        this.m24,
        this.m31,
        this.m32,
        this.m33,
        this.m34,
        this.m41,
        this.m42,
        this.m43,
        this.m44,
      ]);
    }
    toFloat64Array() {
      return new Float64Array([
        this.m11,
        this.m12,
        this.m13,
        this.m14,
        this.m21,
        this.m22,
        this.m23,
        this.m24,
        this.m31,
        this.m32,
        this.m33,
        this.m34,
        this.m41,
        this.m42,
        this.m43,
        this.m44,
      ]);
    }
    static fromMatrix(other: any) {
      return new DOMMatrixPolyfill(other);
    }
    static fromFloat32Array(arr: any) {
      return new DOMMatrixPolyfill(Array.from(arr));
    }
    static fromFloat64Array(arr: any) {
      return new DOMMatrixPolyfill(Array.from(arr));
    }
  }

  (globalThis as any).DOMMatrix = DOMMatrixPolyfill;
  (globalThis as any).DOMMatrixReadOnly = DOMMatrixPolyfill;
  if (typeof global !== "undefined") {
    (global as any).DOMMatrix = DOMMatrixPolyfill;
    (global as any).DOMMatrixReadOnly = DOMMatrixPolyfill;
  }
}

if (typeof (globalThis as any).Path2D === "undefined") {
  (globalThis as any).Path2D = class Path2D {};
  if (typeof global !== "undefined")
    (global as any).Path2D = (globalThis as any).Path2D;
}

if (typeof (globalThis as any).ImageData === "undefined") {
  class ImageDataPolyfill {
    data: Uint8ClampedArray;
    width: number;
    height: number;
    constructor(w: number, h: number) {
      this.width = w;
      this.height = h;
      this.data = new Uint8ClampedArray(w * h * 4);
    }
  }
  (globalThis as any).ImageData = ImageDataPolyfill;
  if (typeof global !== "undefined")
    (global as any).ImageData = ImageDataPolyfill;
}

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

/**
 * Fallback lightweight text extractor from raw PDF stream in case pdf-parse encounters an unhandled runtime error
 */
function fallbackExtractRawPDF(buffer: Buffer): string {
  try {
    let fullText = "";
    const content = buffer.toString("binary");
    const streamRegex = /stream[\r\n]+([\s\S]*?)[\r\n]+endstream/g;
    let match;
    while ((match = streamRegex.exec(content)) !== null) {
      const rawStream = Buffer.from(match[1], "binary");
      let decompressed: Buffer | null = null;
      try {
        decompressed = zlib.inflateSync(rawStream);
      } catch {
        try {
          decompressed = zlib.inflateRawSync(rawStream);
        } catch {
          decompressed = rawStream;
        }
      }
      if (decompressed) {
        const streamStr = decompressed.toString("latin1");
        const tjMatches = streamStr.match(/\(([^)]+)\)\s*Tj/g);
        if (tjMatches) {
          for (const m of tjMatches) {
            const t = m.replace(/^\(/, "").replace(/\)\s*Tj$/, "");
            fullText += t + " ";
          }
        }
        const arrayTjMatches = streamStr.match(/\[([^\]]+)\]\s*TJ/g);
        if (arrayTjMatches) {
          for (const m of arrayTjMatches) {
            const innerMatches = m.match(/\(([^)]+)\)/g);
            if (innerMatches) {
              for (const im of innerMatches) {
                fullText += im.slice(1, -1);
              }
              fullText += " ";
            }
          }
        }
      }
    }
    return fullText.trim();
  } catch {
    return "";
  }
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const pdfModule = require("pdf-parse");
    if (typeof pdfModule === "function") {
      const data = await pdfModule(buffer);
      if (data.text && data.text.trim().length > 0) {
        return data.text;
      }
    } else if (pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: buffer });
      const result = await parser.getText();
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
      if (result.text && result.text.trim().length > 0) {
        return result.text;
      }
    }
    // Fallback if returned empty
    const fallbackText = fallbackExtractRawPDF(buffer);
    if (fallbackText) return fallbackText;
    return "";
  } catch (error: any) {
    console.warn(
      "pdf-parse error, trying fallback raw stream extraction:",
      error,
    );
    const fallbackText = fallbackExtractRawPDF(buffer);
    if (fallbackText && fallbackText.trim().length > 0) {
      return fallbackText;
    }
    throw new Error(
      `Ekstraksi PDF gagal: ${error?.message || "Format PDF tidak dapat dibaca"}`,
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
