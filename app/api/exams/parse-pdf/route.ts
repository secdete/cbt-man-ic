import { NextRequest, NextResponse } from "next/server";
import {
  extractTextFromPDF,
  parseQuestionsDetailed,
  parseQuestionsFromText,
} from "@/lib/pdf-parser";
import { extractStructuredFromPDF, extractTextOnlyFromPDF } from "@/lib/pdf-extract";
import { requireAdmin } from "@/lib/admin-auth";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const contentType = req.headers.get("content-type") || "";

    // Kasus 1: Upload File PDF via Multipart Form Data
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          {
            success: false,
            message: "Berkas PDF tidak ditemukan dalam permintaan.",
          },
          { status: 400 },
        );
      }

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Ekstraksi terstruktur: urutan baris mengikuti tata letak halaman dan
      // gambar soal ikut tertanam sebagai markdown.
      let extractedText = "";
      const notes: string[] = [];
      let imageCount = 0;
      let pageCount = 0;
      try {
        const ext = await extractStructuredFromPDF(buffer);
        extractedText = ext.text;
        notes.push(...ext.notes);
        imageCount = ext.imageCount;
        pageCount = ext.pageCount;
      } catch (error: any) {
        notes.push(
          `Ekstraksi terstruktur gagal (${error?.message || error}); memakai teks mentah biasa.`,
        );
      }

      if (!extractedText || extractedText.trim().length === 0) {
        try {
          extractedText = await extractTextOnlyFromPDF(buffer);
          if (extractedText.trim()) {
            notes.push("Gambar gagal diekstrak, hanya teks yang dipakai.");
          }
        } catch (error: any) {
          notes.push(
            `Ekstraksi teks gagal (${error?.message || error}); mencoba pembaca PDF cadangan.`,
          );
        }
      }

      if (!extractedText || extractedText.trim().length === 0) {
        extractedText = await extractTextFromPDF(buffer);
      }

      if (!extractedText || extractedText.trim().length === 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "PDF berhasil dibaca namun tidak ada teks yang terdeteksi. Pastikan PDF bukan hasil scan gambar murni tanpa OCR.",
          },
          { status: 400 },
        );
      }

      const parsed = parseQuestionsDetailed(extractedText);

      return NextResponse.json({
        success: true,
        fileName: file.name,
        totalQuestionsParsed: parsed.questions.length,
        extractedTextPreview: extractedText.slice(0, 1000),
        questions: parsed.questions,
        strategy: parsed.strategy,
        warnings: parsed.warnings,
        notes,
        imageCount,
        pageCount,
      });
    }

    // Kasus 2: Kirim Teks Mentah (JSON)
    const body = await req.json();
    const { rawText } = body;

    if (!rawText || rawText.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Teks naskah soal tidak boleh kosong." },
        { status: 400 },
      );
    }

    const questions = parseQuestionsFromText(rawText);

    return NextResponse.json({
      success: true,
      totalQuestionsParsed: questions.length,
      questions,
    });
  } catch (error: any) {
    console.error("Error parsing PDF/text:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Gagal mengekstrak soal dari naskah.",
      },
      { status: 500 },
    );
  }
}
