import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  verifyPassword,
  createStudentToken,
  STUDENT_COOKIE_NAME,
} from "@/lib/student-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nisn, password } = body;

    if (!nisn || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "NISN dan Password wajib diisi.",
        },
        { status: 400 },
      );
    }

    const cleanNisn = String(nisn).trim();

    // Cari akun siswa berdasarkan NISN
    const student = await prisma.student.findUnique({
      where: { nisn: cleanNisn },
    });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            "NISN belum terdaftar. Silakan lakukan registrasi akun terlebih dahulu.",
        },
        { status: 401 },
      );
    }

    // Verifikasi password
    const isValid = verifyPassword(
      password,
      student.passwordHash,
      student.salt,
    );
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "NISN atau Password yang Anda masukkan tidak sesuai.",
        },
        { status: 401 },
      );
    }

    // Buat token sesi
    const token = createStudentToken({
      id: student.id,
      nisn: student.nisn,
      name: student.name,
      school: student.school,
    });

    const response = NextResponse.json({
      success: true,
      message: `Selamat datang kembali, ${student.name}!`,
      data: {
        id: student.id,
        name: student.name,
        nisn: student.nisn,
        school: student.school,
      },
    });

    // Pasang cookie sesi HTTP-only aman
    response.cookies.set({
      name: STUDENT_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 hari
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Student login error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Terjadi kesalahan sistem saat login.",
      },
      { status: 500 },
    );
  }
}
