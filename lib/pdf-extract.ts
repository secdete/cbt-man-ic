import zlib from "zlib";
import { isJunkExamLine } from "./pdf-parser";

/**
 * Ekstraksi PDF terstruktur: teks diurutkan sesuai tata letak halaman (bukan
 * urutan stream PDF) + gambar soal yang disisipkan sebagai markdown
 * `![Gambar](data:image/jpeg;base64,....)` (PNG bila encoder JPEG tidak tersedia).
 *
 * Kenapa perlu koordinat:
 * - Banyak naskah soal memuat opsi digambar sebelum nomor soal di stream, sehingga
 *   teks mentah berurutan "A. B. C. D." lalu semua nomor. Dengan koordinat, baris
 *   disusun ulang seperti yang dilihat mata.
 * - Halaman dua kolom harus dipisah dulu, kalau tidak baris kiri & kanan tercampur
 *   dan parser hanya menemukan 1 soal.
 * - Gambar butuh posisi (y) supaya jatuh di soal/opsi yang tepat, sama seperti
 *   pipeline Python lama (scripts/master_extractor.py) yang memakai blok PyMuPDF.
 */

export interface StructuredExtraction {
  text: string;
  pageCount: number;
  imageCount: number;
  ignoredImages: number;
  notes: string[];
}

interface Line {
  text: string;
  x0: number;
  x1: number;
  top: number;
  bottom: number;
}

interface ImageBox {
  dataUrl: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/* ---------------------------------------------------------------- PNG encoder */

let crcTable: Uint32Array | null = null;
function crc32(buf: Buffer): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "latin1");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([length, typeBuf, data, crc]);
}

/** Turunkan resolusi (box average) agar data URL tetap ringan di DB & di HP siswa. */
function downscale(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  channels: number,
  targetWidth: number,
): { data: Uint8ClampedArray; width: number; height: number } {
  if (width <= targetWidth) return { data: src, width, height };
  const factor = Math.ceil(width / targetWidth);
  const nw = Math.floor(width / factor);
  const nh = Math.floor(height / factor);
  if (nw < 1 || nh < 1) return { data: src, width, height };
  const out = new Uint8ClampedArray(nw * nh * channels);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      let r = 0,
        g = 0,
        b = 0,
        a = 0,
        count = 0;
      for (let dy = 0; dy < factor; dy++) {
        const sy = y * factor + dy;
        if (sy >= height) break;
        for (let dx = 0; dx < factor; dx++) {
          const sx = x * factor + dx;
          if (sx >= width) break;
          const i = (sy * width + sx) * channels;
          r += src[i];
          g += channels >= 3 ? src[i + 1] : src[i];
          b += channels >= 3 ? src[i + 2] : src[i];
          if (channels === 4) a += src[i + 3];
          count++;
        }
      }
      const o = (y * nw + x) * channels;
      out[o] = r / count;
      if (channels >= 3) {
        out[o + 1] = g / count;
        out[o + 2] = b / count;
        if (channels === 4) out[o + 3] = a / count;
      } else if (channels === 2) {
        out[o + 1] = a / count;
      }
    }
  }
  return { data: out, width: nw, height: nh };
}

/** Encoder PNG 8-bit (grayscale/RGB/RGBA) tanpa dependensi native. */
export function encodePng(
  width: number,
  height: number,
  pixels: Uint8ClampedArray,
  channels: 1 | 3 | 4 = 4,
): Buffer {
  const colorType = channels === 1 ? 0 : channels === 3 ? 2 : 6;
  const stride = width * channels;
  if (!width || !height || pixels.length < width * height * channels) {
    throw new Error(
      `Buffer piksel tidak lengkap: ${pixels.length} < ${width * height * channels}`,
    );
  }
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: None
    Buffer.from(pixels.buffer, pixels.byteOffset + y * stride, stride).copy(
      raw,
      y * (stride + 1) + 1,
    );
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(colorType, 9);
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

/* ------------------------------------------------- encoder gambar (JPEG/PNG) */

/** Batas total data URL per dokumen: menjaga berkas hasil ekstraksi tetap aman
 *  di bawah batas body request Vercel (4,5 MB) saat ujian disimpan. */
const IMAGE_BUDGET_BYTES = 3_000_000;
const IMAGE_CAP_BYTES = 70_000;

export interface ImageBudget {
  used: number;
  skipped: number;
  limit: number;
}

export function createImageBudget(): ImageBudget {
  return { used: 0, skipped: 0, limit: IMAGE_BUDGET_BYTES };
}

let canvasModule: any;
let canvasLoaded = false;

/**
 * @napi-rs/canvas adalah modul native — dimuat sekali di awal ekstraksi (async)
 * supaya encoder JPEG siap dipakai oleh proses sinkron berikutnya. Bila gagal
 * dimuat, encoder PNG tanpa native dipakai sebagai cadangan.
 */
async function preloadCanvas(): Promise<void> {
  if (canvasLoaded) return;
  canvasLoaded = true;
  try {
    const mod: any = await import("@napi-rs/canvas");
    canvasModule = mod?.createCanvas ? mod : mod?.default ?? null;
  } catch {
    try {
      canvasModule = require("@napi-rs/canvas");
    } catch {
      canvasModule = null;
    }
  }
  if (!canvasModule && process.env.PDF_DEBUG) {
    console.log("[canvas] @napi-rs/canvas tidak tersedia, memakai PNG cadangan");
  }
}

function loadCanvas(): any | null {
  return canvasLoaded ? canvasModule : null;
}

function toRGBA(
  pixels: Uint8ClampedArray,
  width: number,
  height: number,
  channels: 1 | 3 | 4,
): Uint8ClampedArray {
  if (channels === 4) return pixels;
  const out = new Uint8ClampedArray(width * height * 4);
  if (channels === 3) {
    for (let i = 0, j = 0; i < pixels.length; i += 3, j += 4) {
      out[j] = pixels[i];
      out[j + 1] = pixels[i + 1];
      out[j + 2] = pixels[i + 2];
      out[j + 3] = 255;
    }
  } else {
    for (let i = 0, j = 0; i < pixels.length; i++, j += 4) {
      const g = pixels[i];
      out[j] = out[j + 1] = out[j + 2] = g;
      out[j + 3] = 255;
    }
  }
  return out;
}

// Urutan percobaan: kualitas terbaik dulu, diperkecil bila melebihi kuota.
const IMAGE_ATTEMPTS = [
  { maxWidth: 720, quality: 74 },
  { maxWidth: 480, quality: 64 },
  { maxWidth: 320, quality: 55 },
];

function encodePixels(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  budget: ImageBudget,
): string {
  const cap = Math.min(IMAGE_CAP_BYTES, budget.limit - budget.used);
  if (cap < 4_000) {
    budget.skipped++;
    return "";
  }

  const canvas = loadCanvas();
  if (canvas) {
    for (const attempt of IMAGE_ATTEMPTS) {
      try {
        const scaled = downscale(rgba, width, height, 4, attempt.maxWidth);
        const cv = canvas.createCanvas(scaled.width, scaled.height);
        const ctx = cv.getContext("2d");
        ctx.putImageData(
          new canvas.ImageData(scaled.data, scaled.width, scaled.height),
          0,
          0,
        );
        const b64 = cv.encodeSync("jpeg", attempt.quality).toString("base64");
        if (b64.length <= cap) {
          budget.used += b64.length;
          return `data:image/jpeg;base64,${b64}`;
        }
      } catch {
        // coba ukuran berikutnya
      }
    }
    budget.skipped++;
    return "";
  }

  // Cadangan tanpa dependensi native: PNG.
  try {
    const limited = downscale(rgba, width, height, 4, 720);
    const b64 = encodePng(
      limited.width,
      limited.height,
      limited.data,
      4,
    ).toString("base64");
    if (b64.length <= cap) {
      budget.used += b64.length;
      return `data:image/png;base64,${b64}`;
    }
  } catch {
    /* abaikan */
  }
  budget.skipped++;
  return "";
}

/* ------------------------------------------------------------- pdf.js loader */

async function loadPdfJs(): Promise<any> {
  // Spesifikasi impor HARUS berupa teks literal: berkas dengan variabel membuat
  // bundler membuat konteks dinamis sehingga pdfjs ikut terbundel dan path
  // worker-nya (relatif terhadap modul) jadi salah di production build.
  let pdfjs: any = null;
  let lastError: any = null;
  for (const loader of [loadLegacyPdfJs, loadModernPdfJs]) {
    try {
      pdfjs = await loader();
      if (pdfjs?.getDocument) break;
      pdfjs = null;
    } catch (error) {
      lastError = error;
    }
  }
  if (!pdfjs) {
    throw new Error(
      `Modul pdfjs-dist tidak bisa dimuat: ${lastError?.message || lastError}`,
    );
  }

  // Mode "fake worker" pdf.js memuat ulang berkas worker lewat dynamic import
  // yang path-nya relatif — path itu tidak ada setelah dibundel Next.js.
  // Kita impor sendiri modul worker dan publikasikan ke global, maka pdf.js
  // memakainya langsung tanpa dynamic import sama sekali.
  if (!(globalThis as any).pdfjsWorker?.WorkerMessageHandler) {
    try {
      const workerModule: any = await import(
        "pdfjs-dist/legacy/build/pdf.worker.mjs"
      );
      if (workerModule?.WorkerMessageHandler) {
        (globalThis as any).pdfjsWorker = workerModule;
      }
    } catch (error) {
      if (process.env.PDF_DEBUG) {
        console.log(`[worker global gagal] ${(error as any)?.message}`);
      }
    }
  }

  return pdfjs;
}

async function loadLegacyPdfJs(): Promise<any> {
  const imported = await import("pdfjs-dist/legacy/build/pdf.mjs");
  return (imported as any).default ?? imported;
}

async function loadModernPdfJs(): Promise<any> {
  const imported = await import("pdfjs-dist/build/pdf.mjs");
  return (imported as any).default ?? imported;
}

/* --------------------------------------------------------------- text layout */

interface RawRow {
  y: number;
  parts: { x: number; w: number; str: string }[];
}

const quantile = (sorted: number[], q: number) =>
  sorted.length === 0 ? 0 : sorted[Math.min(sorted.length - 1, Math.floor(q * (sorted.length - 1)))];

/**
 * Cari batas kolom halaman. Kandidat diambil dari dua sinyal: lompatan posisi
 * x terkiri antar baris, dan celah yang tak pernah tersentuh teks. Kandidat baru
 * diterima bila kedua sisi cukup berisi DAN benar-benar menyisakan celah di
 * antaranya — kalau tidak, itu cuma beda indentasi pada satu kolom.
 */
function detectColumnSplit(rows: RawRow[], pageWidth: number): number | null {
  const MIN_GAP = 25;
  if (rows.length < 12) return null;

  const candidates: { pos: number; size: number }[] = [];

  const x0s = rows
    .map((r) => Math.min(...r.parts.map((p) => p.x)))
    .sort((a, b) => a - b);
  for (let i = 1; i < x0s.length; i++) {
    const size = x0s[i] - x0s[i - 1];
    if (size >= MIN_GAP) {
      candidates.push({ pos: (x0s[i - 1] + x0s[i]) / 2, size });
    }
  }

  const intervals = rows
    .flatMap((r) => r.parts.map((p) => [p.x, p.x + p.w] as [number, number]))
    .sort((a, b) => a[0] - b[0]);
  const merged: [number, number][] = [];
  for (const [s, e] of intervals) {
    const last = merged[merged.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else merged.push([s, e]);
  }
  for (let i = 1; i < merged.length; i++) {
    const size = merged[i][0] - merged[i - 1][1];
    if (size >= MIN_GAP) {
      candidates.push({ pos: (merged[i - 1][1] + merged[i][0]) / 2, size });
    }
  }

  candidates.sort((a, b) => b.size - a.size);
  for (const { pos } of candidates) {
    if (pos < pageWidth * 0.15 || pos > pageWidth * 0.85) continue;
    const left = rows.filter((r) => r.parts.some((p) => p.x < pos));
    const right = rows.filter((r) => r.parts.some((p) => p.x >= pos));
    if (left.length < 6 || right.length < 6) continue;
    const leftEnds = left
      .flatMap((r) => r.parts.filter((p) => p.x < pos).map((p) => p.x + p.w))
      .sort((a, b) => a - b);
    const rightStarts = right
      .flatMap((r) => r.parts.filter((p) => p.x >= pos).map((p) => p.x))
      .sort((a, b) => a - b);
    const leftEdge = quantile(leftEnds, 0.95);
    const rightEdge = quantile(rightStarts, 0.05);
    if (rightEdge - leftEdge < MIN_GAP) continue;
    return (leftEdge + rightEdge) / 2;
  }
  return null;
}

function buildLines(
  items: any[],
  pageHeight: number,
  pageWidth: number,
): { lines: Line[]; splitX: number | null } {
  const rows: RawRow[] = [];
  for (const item of items) {
    if (typeof item?.str !== "string" || item.str === "") continue;
    const tr = item.transform;
    if (!tr) continue;
    const x = tr[4];
    const yUp = tr[5];
    const h = Math.abs(item.height || tr[3] || 10);
    const w = Math.abs(item.width || 0);
    // pdf.js memberi posisi teks dalam ruang PDF (y ke atas); ubah ke top-down.
    const top = pageHeight - (yUp + h);
    const existing = rows.find((r) => Math.abs(r.y - top) <= 2.5);
    if (existing) existing.parts.push({ x, w, str: item.str });
    else rows.push({ y: top, parts: [{ x, w, str: item.str }] });
  }

  const splitX = detectColumnSplit(rows, pageWidth);

  const lines: Line[] = [];
  for (const row of rows) {
    const parts = [...row.parts].sort((a, b) => a.x - b.x);
    const groups =
      splitX === null
        ? [parts]
        : [parts.filter((p) => p.x < splitX), parts.filter((p) => p.x >= splitX)];
    for (const group of groups) {
      if (group.length === 0) continue;
      let text = "";
      let cursor = group[0].x;
      for (const part of group) {
        const gap = part.x - cursor;
        if (text && gap > 1.2 && !/\s$/.test(text) && !/^\s/.test(part.str)) {
          text += " ";
        }
        text += part.str;
        cursor = part.x + part.w;
      }
      const collapsed = text.replace(/[ \t\u00a0]+/g, " ").trim();
      if (!collapsed) continue;
      lines.push({
        text: collapsed,
        x0: group[0].x,
        x1: Math.max(...group.map((p) => p.x + p.w)),
        top: row.y,
        bottom: row.y + 8,
      });
    }
  }
  lines.sort((a, b) => a.top - b.top || a.x0 - b.x0);
  return { lines, splitX };
}

function splitColumns(lines: Line[], splitX: number | null): Line[][] {
  if (splitX === null) return [lines];
  const left = lines.filter((l) => l.x0 < splitX);
  const right = lines.filter((l) => l.x0 >= splitX);
  if (left.length === 0 || right.length === 0) return [lines];
  return [
    left.sort((a, b) => a.top - b.top),
    right.sort((a, b) => a.top - b.top),
  ];
}

/* ---------------------------------------------------------------- images */

const matMul = (m: number[], n: number[]) => [
  // terapkan m dahulu, baru n  (pdf.js memakai urutan ini untuk op transform-nya)
  m[0] * n[0] + m[1] * n[2],
  m[0] * n[1] + m[1] * n[3],
  m[2] * n[0] + m[3] * n[2],
  m[2] * n[1] + m[3] * n[3],
  m[4] * n[0] + m[5] * n[2] + n[4],
  m[4] * n[1] + m[5] * n[3] + n[5],
];

const overlapsSignificantly = (a: ImageBox, b: ImageBox) => {
  const ix = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const iy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  if (ix <= 0 || iy <= 0) return false;
  const areaA = (a.right - a.left) * (a.bottom - a.top);
  return ix * iy > areaA * 0.6;
};

interface ImagePlacement {
  objId: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  naturalW: number;
  naturalH: number;
}

function objResolved(page: any, objId: string): boolean {
  try {
    if (page.objs.has(objId)) return true;
  } catch {
    /* abaikan */
  }
  try {
    if (page.commonObjs?.has(objId)) return true;
  } catch {
    /* abaikan */
  }
  return false;
}

function getObject(page: any, objId: string): any {
  try {
    if (page.objs.has(objId)) return page.objs.get(objId);
  } catch {
    /* abaikan */
  }
  try {
    if (page.commonObjs?.has(objId)) return page.commonObjs.get(objId);
  } catch {
    /* abaikan */
  }
  return null;
}

/** Objek gambar dari worker pdf.js diselesaikan beberapa ratus ms sesudah op list. */
async function waitForObjs(page: any, objIds: string[], timeoutMs = 8000) {
  if (objIds.length === 0) return;
  const start = Date.now();
  let lastPending = -1;
  let lastChange = start;
  while (Date.now() - start < timeoutMs) {
    const pending = objIds.filter((id) => !objResolved(page, id)).length;
    if (pending === 0) return;
    if (pending !== lastPending) {
      lastPending = pending;
      lastChange = Date.now();
    } else if (Date.now() - lastChange > 3000) {
      // Tak ada kemajuan — objek ini memang tak dikirim worker; jangan buang waktu.
      return;
    }
    await new Promise((r) => setTimeout(r, 40));
  }
}

async function collectImages(
  page: any,
  opList: any,
  pdfjs: any,
  ctx: {
    pageIndex: number;
    pageHeight: number;
    seen: Set<string>;
    budget: ImageBudget;
  },
  ignored: { count: number },
): Promise<ImageBox[]> {
  const OPS = pdfjs.OPS;
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack: number[][] = [];
  const placements: ImagePlacement[] = [];

  for (let i = 0; i < opList.fnArray.length; i++) {
    const fn = opList.fnArray[i];
    const args: any = opList.argsArray[i];
    if (fn === OPS.save) stack.push([...ctm]);
    else if (fn === OPS.restore) ctm = stack.pop() || ctm;
    else if (fn === OPS.transform && args) {
      const m = Array.isArray(args) ? args : Array.from(args);
      if ((m as number[]).length === 6) ctm = matMul(m as number[], ctm);
    } else if (fn === OPS.paintImageXObject) {
      const corners = [
        [ctm[4], ctm[5]],
        [ctm[0] + ctm[4], ctm[1] + ctm[5]],
        [ctm[2] + ctm[4], ctm[3] + ctm[5]],
        [ctm[0] + ctm[2] + ctm[4], ctm[1] + ctm[3] + ctm[5]],
      ];
      const xs = corners.map((c) => c[0]);
      // Ruang PDF berbasis sumbu-Y ke atas, sedangkan baris teks kami ukur dari
      // atas halaman — jadi gambarnya harus dibalik dulu (deviceY = pageH - userY).
      const ys = corners.map((c) => c[1]);
      const yUpMin = Math.min(...ys);
      const yUpMax = Math.max(...ys);
      placements.push({
        objId: args[0],
        left: Math.min(...xs),
        right: Math.max(...xs),
        top: Math.max(0, ctx.pageHeight - yUpMax),
        bottom: Math.min(Math.max(0, ctx.pageHeight - yUpMin), ctx.pageHeight),
        naturalW: typeof args[1] === "number" ? args[1] : 0,
        naturalH: typeof args[2] === "number" ? args[2] : 0,
      });
    }
  }

  if (placements.length === 0) return [];

  // Pra-filter tanpa menunggu piksel: aturan ukuran/kop dari pipeline Python,
  // plus tanda tangan antar-halaman supaya logo & watermark yang berulang
  // tidak ikut terbawa ke naskah.
  const kept: ImagePlacement[] = [];
  for (const pl of placements) {
    if (pl.naturalW === 559 && pl.naturalH === 447) {
      ignored.count++;
      continue; // watermark
    }
    if (pl.naturalW < 30 || pl.naturalH < 20) {
      ignored.count++;
      continue;
    }
    if (ctx.pageIndex === 0 && pl.bottom <= 170) {
      ignored.count++;
      continue; // logo kop halaman pertama
    }
    const signature = `${pl.naturalW}x${pl.naturalH}@${Math.round(pl.left / 4)},${Math.round(pl.top / 4)}`;
    if (ctx.seen.has(signature)) {
      ignored.count++;
      continue; // dekorasi berulang di halaman berikutnya
    }
    ctx.seen.add(signature);
    kept.push(pl);
  }
  if (kept.length === 0) return [];

  await waitForObjs(page, kept.map((p) => p.objId));

  const boxes: ImageBox[] = [];
  for (const pl of kept) {
    let obj: any = null;
    try {
      obj = getObject(page, pl.objId);
    } catch {
      obj = null;
    }
    const pxW = pl.naturalW || obj?.width || 0;
    const pxH = pl.naturalH || obj?.height || 0;
    if (!obj?.data) {
      ignored.count++;
      continue;
    }

    const box: ImageBox = {
      dataUrl: "",
      left: pl.left,
      right: pl.right,
      top: pl.top,
      bottom: pl.bottom,
    };
    if (boxes.some((b) => overlapsSignificantly(b, box))) {
      ignored.count++;
      continue;
    }

    const skippedBefore = ctx.budget.skipped;
    let dataUrl = "";
    try {
      dataUrl = imageDataUrl(obj, pxW, pxH, ctx.budget);
    } catch (error: any) {
      if (process.env.PDF_DEBUG) {
        console.log(`[img gagal] ${pl.objId}: ${error?.message}`);
      }
    }
    if (!dataUrl) {
      if (ctx.budget.skipped === skippedBefore) ignored.count++;
      continue;
    }
    box.dataUrl = dataUrl;
    boxes.push(box);
  }
  return boxes.sort((a, b) => a.top - b.top);
}

function imageDataUrl(
  obj: any,
  fallbackW: number,
  fallbackH: number,
  budget: ImageBudget,
): string {
  const width: number = obj.width || fallbackW;
  const height: number = obj.height || fallbackH;
  const data: Uint8Array | Uint8ClampedArray | null = obj.data;
  if (!data || !width || !height) return "";

  // JPEG asli (jarang, tapi paling ringan)
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8) {
    const b64 = Buffer.from(data).toString("base64");
    if (b64.length <= IMAGE_CAP_BYTES && b64.length <= budget.limit - budget.used) {
      budget.used += b64.length;
      return `data:image/jpeg;base64,${b64}`;
    }
    budget.skipped++;
    return "";
  }

  // 1 = grayscale 8-bit, 2 = RGB, 3 = RGBA (enum pdf.js ImageKind)
  const kind: number = obj.kind || 3;
  const sourceChannels: 1 | 3 | 4 = kind === 1 ? 1 : kind === 2 ? 3 : 4;
  const expected = width * height * sourceChannels;
  if (data.length < expected) return "";

  const pixels = new Uint8ClampedArray(data.buffer, data.byteOffset, expected);
  return encodePixels(toRGBA(pixels, width, height, sourceChannels), width, height, budget);
}

/* ------------------------------------------------------------- utama */

export async function extractStructuredFromPDF(
  buffer: Buffer,
): Promise<StructuredExtraction> {
  await preloadCanvas();
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const notes: string[] = [];
  const pageTexts: string[] = [];
  const pageCount = doc.numPages;
  let imageCount = 0;
  const ignored = { count: 0 };
  const seen = new Set<string>();
  const budget = createImageBudget();

  try {
    for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
      const page = await doc.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: 1 });
      const pageHeight = viewport.height;
      const pageWidth = viewport.width;

      const [textContent, opList] = await Promise.all([
        page.getTextContent(),
        page.getOperatorList(),
      ]);

      const built = buildLines(textContent.items || [], pageHeight, pageWidth);
      const splitX = built.splitX;
      const allLines = built.lines.filter((l) => !isJunkExamLine(l.text));
      const columns = splitColumns(allLines, splitX);
      const images = await collectImages(
        page,
        opList,
        pdfjs,
        { pageIndex, pageHeight, seen, budget },
        ignored,
      );
      imageCount += images.length;

      if (process.env.PDF_DEBUG && pageIndex + 1 === Number(process.env.PDF_DEBUG_PAGE || 1)) {
        console.log(`--- halaman ${pageIndex + 1} splitX=${splitX}`);
        for (const l of allLines) {
          console.log(
            `  teks top=${l.top.toFixed(1)} ${JSON.stringify(l.text.slice(0, 70))}`,
          );
        }
        for (const im of images) {
          console.log(
            `  gambar top=${im.top.toFixed(1)} bottom=${im.bottom.toFixed(1)} ` +
              `left=${im.left.toFixed(1)} right=${im.right.toFixed(1)}`,
          );
        }
      }

      const placedImages = new Set<number>();
      const chunks: string[] = [];
      for (const lines of columns) {
        const sequence: { top: number; render: () => string }[] = lines.map(
          (l) => ({ top: l.top, render: () => l.text }),
        );
        for (const [idx, img] of images.entries()) {
          if (placedImages.has(idx)) continue;
          const center = (img.left + img.right) / 2;
          const imageColumn = splitX !== null && center >= splitX ? 1 : 0;
          const lineColumn = columns.length === 1 ? 0 : lines === columns[0] ? 0 : 1;
          if (imageColumn !== lineColumn) continue;
          placedImages.add(idx);
          sequence.push({
            top: img.top,
            render: () => `![Gambar Soal](${img.dataUrl})`,
          });
        }
        sequence.sort((a, b) => a.top - b.top);
        chunks.push(sequence.map((s) => s.render()).join("\n"));
      }
      // Gambar yang tidak masuk kolom mana pun tetap ditaruh di akhir halaman.
      for (const [idx, img] of images.entries()) {
        if (placedImages.has(idx)) continue;
        chunks.push(`![Gambar Soal](${img.dataUrl})`);
      }

      const pageText = chunks.filter((c) => c.trim()).join("\n\n");
      if (pageText) pageTexts.push(pageText);
    }
  } finally {
    try {
      await doc.destroy();
    } catch {
      /* abaikan */
    }
  }

  if (ignored.count > 0) {
    notes.push(
      `${ignored.count} gambar kecil/watermark/kop otomatis diabaikan agar tidak memenuhi naskah.`,
    );
  }
  if (budget.skipped > 0) {
    notes.push(
      `${budget.skipped} gambar dilewati karena total gambar sudah melewati batas 3 MB agar naskah tetap ringan saat disimpan.`,
    );
  }

  return {
    text: pageTexts.join("\n\n"),
    pageCount,
    imageCount,
    ignoredImages: ignored.count,
    notes,
  };
}

/**
 * Cadangan bila ekstraksi ber-gambar gagal: baris teks tetap disusun menurut
 * tata letak halaman, hanya gambarnya dilewati. Masih memakai pdf.js sehingga
 * tidak bergantung pada modul lain.
 */
export async function extractTextOnlyFromPDF(buffer: Buffer): Promise<string> {
  const pdfjs = await loadPdfJs();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buffer),
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const pageTexts: string[] = [];
  try {
    for (let pageIndex = 0; pageIndex < doc.numPages; pageIndex++) {
      const page = await doc.getPage(pageIndex + 1);
      const viewport = page.getViewport({ scale: 1 });
      const textContent = await page.getTextContent();
      const { lines } = buildLines(
        textContent.items || [],
        viewport.height,
        viewport.width,
      );
      const text = lines
        .map((l) => l.text)
        .filter((t) => !isJunkExamLine(t))
        .join("\n")
        .trim();
      if (text) pageTexts.push(text);
    }
  } finally {
    try {
      await doc.destroy();
    } catch {
      /* abaikan */
    }
  }
  return pageTexts.join("\n\n");
}
