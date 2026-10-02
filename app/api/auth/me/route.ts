import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { STUDENT_SESSION_COOKIE, verifyStudentSession } from "@/lib/student-auth";

export const dynamic = "force-dynamic";

// Profil peserta yang sedang login. Dipakai halaman utama untuk mengisi
// identitas otomatis dan navbar untuk menampilkan ikon profil.
export async function GET(req: NextRequest) {
  const studentId = verifyStudentSession(req.cookies.get(STUDENT_SESSION_COOKIE)?.value);

  if (!studentId) {
    return NextResponse.json(
      { success: false, message: "Anda belum login." },
      { status: 401 },
    );
  }

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      name: true,
      school: true,
      phone: true,
      username: true,
    },
  });

  if (!student) {
    const response = NextResponse.json(
      { success: false, message: "Akun tidak ditemukan. Silakan login kembali." },
      { status: 401 },
    );
    response.cookies.delete(STUDENT_SESSION_COOKIE);
    return response;
  }

  return NextResponse.json({ success: true, data: student });
}
