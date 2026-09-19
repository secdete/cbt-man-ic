import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  hashPassword,
  createStudentToken,
  STUDENT_COOKIE_NAME,
} from "@/lib/student-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, nisn, school, password } = body;

    // Validasi input
    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Nama Lengkap wajib diisi (minimal 2 karakter).",
        },
        { status: 400 },
      );
    }

    if (!nisn || typeof nisn !== "string" || nisn.trim().length < 4) {
      return NextResponse.json(
        {
          success: false,
          message: "NISN / Nomor Peserta wajib diisi (minimal 4 karakter).",
        },
        { status: 400 },
      );
    }

    if (!password || typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        {
          success: false,
          message: "Password minimal terdiri dari 6 karakter.",
        },
        { status: 400 },
      );
    }

    const cleanNisn = nisn.trim();
    const cleanName = name.trim();
    const cleanSchool = school ? String(school).trim() : null;

    // Cek apakah NISN sudah pernah terdaftar
    const existing = await prisma.student.findUnique({
      where: { nisn: cleanNisn },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `NISN "${cleanNisn}" sudah terdaftar. Silakan pilih tab "Masuk Akun Siswa".`,
        },
        { status: 409 },
      );
    }

    // Hash password secara aman menggunakan scrypt + salt unik
    const { hash, salt } = hashPassword(password);

    // Simpan ke database
    const student = await prisma.student.create({
      data: {
        name: cleanName,
        nisn: cleanNisn,
        school: cleanSchool,
        passwordHash: hash,
        salt: salt,
      },
    });

    // Buat token sesi siswa
    const token = createStudentToken({
      id: student.id,
      nisn: student.nisn,
      name: student.name,
      school: student.school,
    });

    const response = NextResponse.json({
      success: true,
      message: "Pendaftaran akun siswa berhasil!",
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
    console.error("Student registration error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Terjadi kesalahan sistem saat mendaftar.",
      },
      { status: 500 },
    );
  }
}
