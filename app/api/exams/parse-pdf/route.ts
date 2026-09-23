import { NextRequest, NextResponse } from "next/server";
import { extractTextFromPDF, parseQuestionsFromText } from "@/lib/pdf-parser";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
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

      const extractedText = await extractTextFromPDF(buffer);

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

      const questions = parseQuestionsFromText(extractedText);

      return NextResponse.json({
        success: true,
        fileName: file.name,
        totalQuestionsParsed: questions.length,
        extractedTextPreview: extractedText.slice(0, 1000),
        questions,
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
