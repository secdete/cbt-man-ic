import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export const dynamic = "force-dynamic";
const cleanPdfText = (value: string) =>
  value.replace(/[\u200e-\u200f\u202a-\u202e\u2066-\u2069]/g, "").replace(/[^\x20-\x7e\xa0-\xff]/g, "");

export async function GET(req: NextRequest) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const idsParam = req.nextUrl.searchParams.get("ids");
    const orderedIds = idsParam
      ? idsParam
          .split(",")
          .map((id) => id.trim())
          .filter(Boolean)
      : [];

    const students = await prisma.student.findMany({
      where: orderedIds.length ? { id: { in: orderedIds } } : {},
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        name: true,
        nisn: true,
        username: true,
        email: true,
        password: true,
      },
    });

    const pdfDoc = await PDFDocument.create();
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    const marginX = 28;
    const marginY = 28;
    const columnGap = 16;
    const rowGap = 16;
    const cardWidth = (pageWidth - marginX * 2 - columnGap) / 2;
    const cardHeight = (pageHeight - marginY * 2 - rowGap * 2) / 3;
    const headerHeight = 28;
    const padding = 12;

    const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const normal = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const navy = rgb(0.11, 0.15, 0.22);
    const labelColor = rgb(0.42, 0.48, 0.57);
    const valueColor = rgb(0.08, 0.11, 0.17);
    const fitTextSize = (text: string, font: typeof bold, maxWidth: number, preferredSize: number) => {
      let size = preferredSize;
      while (size > 7 && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
      return size;
    };

    const totalPages = Math.ceil(students.length / 6);
    const pages = Array.from({ length: totalPages }, () => pdfDoc.addPage([pageWidth, pageHeight]));

    students.forEach((student, index) => {
      const pageIndex = Math.floor(index / 6);
      const pageRef = pages[pageIndex];
      const slotIndex = index % 6;
      const row = Math.floor(slotIndex / 2);
      const col = slotIndex % 2;
      const x = marginX + col * (cardWidth + columnGap);
      const top = pageHeight - marginY - row * (cardHeight + rowGap);
      const y = top - cardHeight;
      const innerWidth = cardWidth - padding * 2;

      pageRef.drawRectangle({
        x,
        y,
        width: cardWidth,
        height: cardHeight,
        borderColor: rgb(0.78, 0.82, 0.87),
        borderWidth: 0.8,
        color: rgb(0.97, 0.98, 0.99),
      });

      pageRef.drawRectangle({
        x,
        y: top - headerHeight,
        width: cardWidth,
        height: headerHeight,
        color: navy,
      });

      pageRef.drawText("KARTU PESERTA UJIAN - MAN IC", {
        x: x + padding,
        y: top - 18,
        size: 11,
        font: bold,
        color: rgb(1, 1, 1),
      });

      const fields = [
        { label: "Nama:", value: cleanPdfText(student.name || "-"), valueFont: bold },
        { label: "No. Peserta:", value: cleanPdfText(student.nisn || student.username || "-"), valueFont: bold },
        { label: "Password:", value: cleanPdfText(student.password || "-"), valueFont: bold },
        { label: "Email (Alternatif Login):", value: cleanPdfText(student.email || "-"), valueFont: bold },
      ];
      const fieldOffsets = [44, 78, 112, 146];

      fields.forEach((field, fieldIndex) => {
        const labelY = top - fieldOffsets[fieldIndex];
        const value = field.value;
        const valueSize = fitTextSize(value, field.valueFont, innerWidth, 10);

        pageRef.drawText(field.label, {
          x: x + padding,
          y: labelY,
          size: 7.5,
          font: normal,
          color: labelColor,
        });
        pageRef.drawText(value, {
          x: x + padding,
          y: labelY - 12,
          size: valueSize,
          font: field.valueFont,
          color: valueColor,
        });
      });

      pageRef.drawText("*Gunakan email jika password utama bermasalah.", {
        x: x + padding,
        y: y + 12,
        size: 7,
        font: normal,
        color: rgb(0.59, 0.64, 0.71),
      });
    });

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="kartu-peserta-cbt.pdf"',
      },
    });
  } catch (error) {
    console.error("Student card PDF failed:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat kartu peserta PDF." },
      { status: 500 },
    );
  }
}
