import { PrismaClient } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

const prisma = new PrismaClient();

const headers = [
  "Timestamp",
  "Email address",
  "Nama Siswa",
  "Asal Sekolah",
  "Nomor Whatsapp Aktif Siswa",
  "Nomor Whatsapp Aktif Orang TuaWali",
  "Impian Masuk MAN Insan Cendikia kota apa ?",
  "password",
];

export async function GET(req: NextRequest) {
  try {
    const ids = req.nextUrl.searchParams
      .get("ids")
      ?.split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const templateOnly = req.nextUrl.searchParams.get("template") === "1";
    const students = templateOnly
      ? []
      : await prisma.student.findMany({
          where: ids?.length ? { id: { in: ids } } : {},
          orderBy: { createdAt: "asc" },
          select: {
            registrationTimestamp: true,
            createdAt: true,
            email: true,
            name: true,
            school: true,
            phone: true,
            parentWhatsapp: true,
            dreamCity: true,
            password: true,
          },
        });

    const rows = students.map((student) => ({
      [headers[0]]: student.registrationTimestamp || student.createdAt.toISOString(),
      [headers[1]]: student.email || "",
      [headers[2]]: student.name,
      [headers[3]]: student.school || "",
      [headers[4]]: student.phone || "",
      [headers[5]]: student.parentWhatsapp || "",
      [headers[6]]: student.dreamCity || "",
      [headers[7]]: student.password,
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
    worksheet["!cols"] = headers.map((header) => ({ wch: Math.min(Math.max(header.length, 18), 42) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Peserta");

    const file = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
    const filename = templateOnly ? "template-data-peserta.xlsx" : "data-peserta.xlsx";

    return new NextResponse(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Export students failed:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengekspor data peserta ke Excel." },
      { status: 500 },
    );
  }
}
