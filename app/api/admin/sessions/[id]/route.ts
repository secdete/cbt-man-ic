import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const session = await prisma.examSession.findUnique({
      where: { id },
      select: { id: true, studentName: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi ujian tidak ditemukan." },
        { status: 404 },
      );
    }

    await prisma.examSession.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: `Sesi ujian atas nama "${session.studentName}" berhasil direset/dihapus. Siswa dapat memulai ujian kembali.`,
    });
  } catch (error: any) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus sesi ujian." },
      { status: 500 },
    );
  }
}
