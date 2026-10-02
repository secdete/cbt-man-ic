import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, signAdminSession } from "@/lib/admin-auth";
import { normalizePhone } from "@/lib/phone";
import { verifyStudentPassword } from "@/lib/student-password";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const USER_SESSION_COOKIE = "cbt_user_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const username = String(payload?.username ?? "").trim();
    const password = String(payload?.password ?? "").trim();

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: "Username dan Password wajib diisi." },
        { status: 400 },
      );
    }

    const expectedUsername = process.env.ADMIN_USERNAME || "admin";
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

    // Login panitia: cookie ditandatangani HMAC sehingga tidak bisa dipalsukan.
    if (username === expectedUsername && password === expectedPassword) {
      const response = NextResponse.json({
        success: true,
        message: "Login admin berhasil.",
        role: "admin",
        redirectTo: "/admin",
      });
      response.cookies.set({
        name: ADMIN_SESSION_COOKIE,
        value: await signAdminSession(username),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: SESSION_MAX_AGE,
        path: "/",
      });
      return response;
    }

    // Login peserta: harus cocok dengan data terdaftar (impor Excel / dibuat lewat form ujian).
    const phone = normalizePhone(username);
    const student = await prisma.student.findFirst({
      where: { OR: [{ username }, { phone: username }, ...(phone ? [{ phone }] : [])] },
      select: { username: true, phone: true, password: true, passwordHash: true, salt: true },
    });

    if (!student || !verifyStudentPassword(password, student)) {
      return NextResponse.json(
        { success: false, message: "Username atau Password salah." },
        { status: 401 },
      );
    }

    const response = NextResponse.json({
      success: true,
      message: "Login berhasil.",
      role: "student",
      redirectTo: "/",
    });
    response.cookies.set({
      name: USER_SESSION_COOKIE,
      value: Buffer.from(
        JSON.stringify({
          username: student.username || student.phone,
          role: "student",
          timestamp: Date.now(),
        }),
      ).toString("base64"),
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: SESSION_MAX_AGE,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan sistem saat login." },
      { status: 500 },
    );
  }
}
