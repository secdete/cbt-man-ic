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

/* ------------------------------------------------------------ baris sampah */

const JUNK_LINE_KEYS = [
  "MATERI UJIAN SNPDB",
  "MATA UJI",
  "Version 1.0",
  "Pengawas Ruang",
  "UIN Sunan Ampel",
  "DOKUMEN RAHASIA",
  "CBT Master Panel",
  "NASKAH SOAL TRYOUT",
  "Pengawas ujian",
];

/** Baris kop/footers naskah yang tidak boleh ikut jadi soal. */
export function isJunkExamLine(rawText: string): boolean {
  const t = (rawText || "").trim();
  if (!t) return true;
  if (JUNK_LINE_KEYS.some((k) => t.includes(k))) return true;
  if (/^--\s*\d+\s*(of|dari)\s*\d+\s*--$/i.test(t)) return true;
  if (/^halaman\s+\d+(\s*dari\s+\d+)?$/i.test(t)) return true;
  if (/^page\s+\d+(\s*of\s*\d+)?$/i.test(t)) return true;
  return false;
}

/* -------------------------------------------------- deteksi awal soal/opsi */

// "1." / "1)" / "1 - " / "1.Makna" / "Soal 3." — termasuk nomor tanpa tanda
// ("1" di baris sendiri). "1.5" sengaja ditolak agar angka desimal tak jadi nomor.
const HEADER_LINE_RE =
  /^(?:soal\s*(?:nomor|no)?\.?\s*)?(\d{1,3})(?:\s*[.)\-–]\s*(?!\d)|\s*$)/i;

// "(A) teks" / "A. teks" / "A) teks" di awal baris
const OPTION_LINE_RE = /^\s*(\()?([A-Ea-e])\s*([.)])\s*/;

// Baris yang hanya berisi satu markdown gambar
const IMAGE_LINE_RE = /^!\[[^\]]*\]\([^)]*\)$/;

/**
 * Gambar yang berdiri sendiri tepat di atas nomor soal adalah gambar untuk soal
 * itu sendiri (bacaan/gambar ilustrasi), bukan pelengkap soal sebelumnya.
 * Dalam aliran teks PDF gambar semacam ini selalu muncul sebelum angka soalnya,
 * sehingga tanpa dipindah ia jatuh ke opsi terakhir butir sebelumnya.
 */
function hoistImagesAboveHeaders(lines: string[]): string[] {
  const out = lines.slice();
  for (let i = out.length - 2; i >= 0; i--) {
    if (!IMAGE_LINE_RE.test(out[i])) continue;
    if (!HEADER_LINE_RE.test(out[i + 1] || "")) continue;
    const [image] = out.splice(i, 1);
    out.splice(i + 1, 0, image);
  }
  return out;
}

interface HeaderLine {
  line: number;
  number: number;
  rest: string;
}

function collectHeaders(lines: string[]): HeaderLine[] {
  const candidates: HeaderLine[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(HEADER_LINE_RE);
    if (!m) continue;
    candidates.push({
      line: i,
      number: parseInt(m[1], 10),
      rest: lines[i].slice(m[0].length).trim(),
    });
  }

  // Buang nomor palsu (tahun, catatan kaki, daftar isi) dengan validasi berurutan.
  const kept: HeaderLine[] = [];
  let expected = -1;
  for (const c of candidates) {
    if (c.number < 1 || c.number > 300) continue;
    if (expected === -1) {
      kept.push(c);
      expected = c.number + 1;
      continue;
    }
    if (c.number === expected || (c.number === 1 && expected > 2)) {
      kept.push(c);
      expected = c.number + 1;
      continue;
    }
    if (c.number > expected && c.number - expected <= 2) {
      kept.push(c);
      expected = c.number + 1;
    }
    // selain itu: nomor palsu → lepas
  }
  return kept;
}

function collectOptionAnchors(
  lines: string[],
): { line: number; letter: string }[] {
  const raw: { line: number; letter: string; wrapped: boolean }[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(OPTION_LINE_RE);
    if (!m) continue;
    // "(A)" / "A)" dianggap gaya berkurung; "A." adalah gaya titik yang sering
    // muncul sebagai label daftar di tengah naskah (bukan pilihan jawaban).
    const wrapped = Boolean(m[1]) || m[3] === ")";
    raw.push({ line: i, letter: m[2].toUpperCase(), wrapped });
  }

  const wrappedA = raw.filter((a) => a.letter === "A" && a.wrapped).length;
  const bareA = raw.filter((a) => a.letter === "A" && !a.wrapped).length;
  const useWrappedOnly = wrappedA > 0 && wrappedA >= bareA;
  const kept = useWrappedOnly ? raw.filter((a) => a.wrapped) : raw;
  return kept.map(({ line, letter }) => ({ line, letter }));
}

/* --------------------------------------------------------- skor kualitas */

const DUMMY_OPTION_RE = /^(pilihan|opsi)\s*[a-e]$/i;
const IMAGE_MARKER_RE = /!\[[^\]]*\]\([^)]*\)/g;

function scoreQuestions(questions: ParsedQuestion[]): number {
  if (questions.length === 0) return 0;
  let score = questions.length > 1 ? 10 : 0;
  for (const q of questions) {
    const realOptions = [q.optionA, q.optionB, q.optionC, q.optionD].filter(
      (o) => o && !DUMMY_OPTION_RE.test(o.trim()),
    ).length;
    if (realOptions >= 3) score += 12;
    else if (realOptions >= 2) score += 6;
    const stemLen = q.questionText.replace(IMAGE_MARKER_RE, "").trim().length;
    if (stemLen >= 20) score += 4;
    else if (stemLen >= 5) score += 1;
  }
  return score;
}

/* ------------------------------------------------------- strategi parsing */

function detectBottomKeys(text: string): Map<number, string> {
  const map = new Map<number, string>();
  const keyMatch = text.match(
    /(?:kunci\s*jawaban|daftar\s*kunci|kunci\s*soal)[\s\S]*$/i,
  );
  if (!keyMatch) return map;
  const itemKeyRegex = /(?:(\d+)\s*[\.\:\-\)]\s*([A-Ea-e]))/g;
  let ikm: RegExpExecArray | null;
  while ((ikm = itemKeyRegex.exec(keyMatch[0])) !== null) {
    map.set(parseInt(ikm[1], 10), ikm[2].toUpperCase());
  }
  return map;
}

/** Strategi 1: satu blok per nomor soal berurutan. */
function parseByHeaders(
  lines: string[],
  headers: HeaderLine[],
  keys: Map<number, string>,
): ParsedQuestion[] {
  const out: ParsedQuestion[] = [];
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    const endLine = i + 1 < headers.length ? headers[i + 1].line : lines.length;
    const parts: string[] = [];
    if (h.rest) parts.push(h.rest);
    for (let l = h.line + 1; l < endLine; l++) parts.push(lines[l]);
    const parsed = parseSingleQuestionBlock(
      h.number,
      parts.join("\n").trim(),
      keys.get(h.number),
    );
    if (parsed) out.push(parsed);
  }
  return out;
}

/**
 * Strategi 2: pasangkan nomor soal ke-i dengan grup opsi A ke-i.
 * Penting untuk naskah yang urutan stream PDF-nya "opsi dulu, nomor belakangan".
 */
function parseByPairing(
  lines: string[],
  headers: HeaderLine[],
  anchorsA: number[],
  keys: Map<number, string>,
): ParsedQuestion[] {
  if (anchorsA.length === 0) return [];
  const out: ParsedQuestion[] = [];
  const headerLines = headers.map((h) => h.line);

  // Batas opsi dihitung dulu untuk semua soal, lalu stem tiap soal mulai setelah
  // batas opsi soal sebelumnya — baris yang sama (termasuk gambar) tidak boleh
  // ikut dua kali ke dua butir karena rentangnya saling tumpang tindih.
  const optEnds = anchorsA.map((optStart, k) => {
    let optEnd = k + 1 < anchorsA.length ? anchorsA[k + 1] : lines.length;
    const nextHeader = headerLines.find((l) => l > optStart);
    if (nextHeader !== undefined && nextHeader < optEnd) optEnd = nextHeader;
    // Batas wajar: 4-5 opsi + gambar ≈ 12 baris.
    if (optEnd - optStart > 12) optEnd = optStart + 12;
    return optEnd;
  });

  for (let k = 0; k < anchorsA.length; k++) {
    const optStart = anchorsA[k];
    const optEnd = optEnds[k];
    const optionsText = lines.slice(optStart, optEnd).join("\n").trim();
    const prevEnd = k === 0 ? 0 : optEnds[k - 1];

    let stemParts: string[] = [];
    let number = k + 1;
    const h = headers[k];
    if (h) {
      number = h.number;
      if (h.line < optStart) {
        // Normal: nomor + stem sebelum opsi sendiri.
        stemParts = [
          h.rest,
          ...lines.slice(Math.max(h.line + 1, prevEnd), optStart),
        ];
      } else {
        // Stem belakangan: hentikan sebelum grup opsi berikutnya.
        let endStem = headerLines.find((l) => l > h.line) ?? lines.length;
        const nextAnchor = anchorsA.find((a) => a > h.line);
        if (nextAnchor !== undefined && nextAnchor < endStem) {
          endStem = nextAnchor;
        }
        endStem = Math.min(endStem, h.line + 40);
        stemParts = [
          h.rest,
          ...lines.slice(Math.max(h.line + 1, prevEnd), endStem),
        ];
      }
    }

    const block = [...stemParts, optionsText]
      .map((s) => s.trim())
      .filter(Boolean)
      .join("\n");
    const parsed = parseSingleQuestionBlock(
      number,
      block,
      keys.get(number),
    );
    if (parsed) out.push(parsed);
  }
  return out;
}

/**
 * Strategi 3: tanpa nomor sama sekali — kelompokkan opsi A-E berurutan,
 * stem adalah baris di antara isi opsi terakhir dengan opsi A berikutnya.
 */
function parseByOptionGroups(
  lines: string[],
  anchors: { line: number; letter: string }[],
  keys: Map<number, string>,
): ParsedQuestion[] {
  if (anchors.length < 2) return [];
  const clusters: number[][] = [];
  for (const a of anchors) {
    const cur = clusters[clusters.length - 1];
    if (cur && cur.length > 0) {
      const prevIdx = anchors.findIndex((x) => x.line === cur[cur.length - 1]);
      const prevLetter = anchors[prevIdx]?.letter ?? "";
      if (a.letter === String.fromCharCode(prevLetter.charCodeAt(0) + 1)) {
        cur.push(a.line);
        continue;
      }
    }
    if (!cur || a.letter === "A" || cur.length >= 5) clusters.push([a.line]);
    else cur.push(a.line);
  }

  const anchorLineSet = new Set(anchors.map((a) => a.line));
  const out: ParsedQuestion[] = [];
  for (let k = 0; k < clusters.length; k++) {
    const cluster = clusters[k];
    const start = cluster[0];
    const last = cluster[cluster.length - 1];
    const optEnd = Math.min(last + 2, lines.length);
    const stemEnd = start;
    const stemStart = k === 0 ? 0 : (clusters[k - 1][clusters[k - 1].length - 1] + 2);
    const stemLines = lines.slice(Math.min(stemStart, stemEnd), stemEnd);
    const optLines = lines.slice(start, optEnd).filter((_, idx) => {
      const lineIdx = start + idx;
      return lineIdx <= last || !anchorLineSet.has(lineIdx);
    });
    const block = [...stemLines, ...optLines].join("\n").trim();
    const parsed = parseSingleQuestionBlock(k + 1, block, keys.get(k + 1));
    if (parsed) out.push(parsed);
  }
  return out;
}

/* -------------------------------------------------------------- utama */

export interface ParseQuestionsResult {
  questions: ParsedQuestion[];
  strategy: string;
  warnings: string[];
}

/**
 * Parsing teks ujian menjadi butir-butir soal terstruktur.
 * Mencoba beberapa strategi segmentasi lalu memilih yang paling lengkap,
 * supaya naskah berpola aneh (opsi duluan, nomor tanpa spasi, tanpa nomor)
 * tidak berakhir cuma 1 soal.
 */
export function parseQuestionsFromText(rawText: string): ParsedQuestion[] {
  return parseQuestionsDetailed(rawText).questions;
}

export function parseQuestionsDetailed(
  rawText: string,
): ParseQuestionsResult {
  const warnings: string[] = [];
  if (!rawText || rawText.trim().length === 0) {
    return {
      questions: [],
      strategy: "kosong",
      warnings: ["Teks naskah kosong."],
    };
  }

  // Bersihkan karakter aneh dan standarisasi baris, buang kop/footers.
  const cleanText = rawText
    .replace(/\0/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ");
  const lines = hoistImagesAboveHeaders(
    cleanText
      .split("\n")
      .map((l) => l.replace(/[ \u00a0]+/g, " ").trim())
      .filter((l) => !isJunkExamLine(l)),
  );
  const text = lines.join("\n").trim();
  if (!text) {
    return {
      questions: [],
      strategy: "kosong",
      warnings: ["Teks naskah hanya berisi kop/footers, tidak ada isi soal."],
    };
  }

  const keys = detectBottomKeys(text);
  const headers = collectHeaders(lines);
  const anchors = collectOptionAnchors(lines);
  const anchorsA = anchors.filter((a) => a.letter === "A").map((a) => a.line);

  const strategies: { name: string; run: () => ParsedQuestion[] }[] = [
    { name: "penomoran", run: () => parseByHeaders(lines, headers, keys) },
    {
      name: "pasang-opsi",
      run: () => parseByPairing(lines, headers, anchorsA, keys),
    },
    {
      name: "grup-opsi",
      run: () => parseByOptionGroups(lines, anchors, keys),
    },
  ];

  let best: { name: string; questions: ParsedQuestion[]; score: number } | null =
    null;
  for (const s of strategies) {
    let qs: ParsedQuestion[] = [];
    try {
      qs = s.run();
    } catch {
      qs = [];
    }
    const score = scoreQuestions(qs);
    if (!best || score > best.score) {
      best = { name: s.name, questions: qs, score };
    }
  }

  if (!best || best.questions.length === 0) {
    warnings.push(
      "Struktur naskah tidak terbaca otomatis (tidak ada penomoran maupun grup opsi). Seluruh teks dimasukkan ke 1 soal — silakan pisahkan manual di editor.",
    );
    return { questions: fallbackParser(text), strategy: "fallback", warnings };
  }

  let questions = best.questions;
  const numbers = questions.map((q) => q.questionNumber);
  const unique = new Set(numbers).size === numbers.length;
  const increasing = numbers.every((n, i) => i === 0 || n > numbers[i - 1]);
  if (!unique || !increasing) {
    questions = questions.map((q, i) => ({ ...q, questionNumber: i + 1 }));
  }

  questions = promoteImageOptions(questions);

  const withoutOptions = questions.filter((q) =>
    [q.optionA, q.optionB, q.optionC, q.optionD].every((o) =>
      DUMMY_OPTION_RE.test((o || "").trim()),
    ),
  ).length;
  if (questions.length === 1) {
    warnings.push(
      "Hanya 1 soal terdeteksi dari naskah ini. Periksa apakah penomoran/opsi berbeda dari format umum, lalu tambahkan soal manual bila perlu.",
    );
  }
  if (withoutOptions > 0) {
    warnings.push(
      `${withoutOptions} soal belum punya opsi A-D terbaca otomatis (ditandai "Pilihan A" dst). Lengkapi sebelum disimpan.`,
    );
  }

  return { questions, strategy: best.name, warnings };
}

/**
 * Soal bergambar murni: bila seluruh opsi masih placeholder sedangkan teks
 * memuat ≥4 gambar, gambar terakhir dialihkan jadi opsi A-D (sama perilaku
 * dengan ekstraktor Python lama).
 */
function promoteImageOptions(questions: ParsedQuestion[]): ParsedQuestion[] {
  return questions.map((q) => {
    const hasRealOptions = [q.optionA, q.optionB, q.optionC, q.optionD].some(
      (o) => o && !DUMMY_OPTION_RE.test(o.trim()),
    );
    if (hasRealOptions) return q;
    const markers = q.questionText.match(new RegExp(IMAGE_MARKER_RE.source, "g"));
    if (!markers || markers.length < 4) return q;
    const [a, b, c, d] = markers.slice(-4);
    const remaining = q.questionText
      .replace(new RegExp(IMAGE_MARKER_RE.source, "g"), "")
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
    return {
      ...q,
      questionText: remaining || `Soal nomor ${q.questionNumber}`,
      optionA: a,
      optionB: b,
      optionC: c,
      optionD: d,
    };
  });
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
  // Jika struktur naskah tak terbaca sama sekali, satu blok teks penuh agar
  // admin masih bisa memotongnya manual di editor.
  const body = text.trim().slice(0, 4000);
  return [
    {
      questionNumber: 1,
      questionText: body || "Teks naskah kosong",
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
