import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const expectedUsername = process.env.ADMIN_USERNAME || "admin";
    const expectedPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (username !== expectedUsername || password !== expectedPassword) {
      return NextResponse.json(
        { success: false, message: "Username atau Password panitia salah." },
        { status: 401 },
      );
    }

    // Buat response dan set cookie session
    const response = NextResponse.json({
      success: true,
      message: "Login admin berhasil.",
    });

    const tokenValue = Buffer.from(`${username}:${Date.now()}`).toString(
      "base64",
    );

    response.cookies.set({
      name: "cbt_admin_session",
      value: tokenValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 hari
      path: "/",
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan sistem saat login." },
      { status: 500 },
    );
  }
}
