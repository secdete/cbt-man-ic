import { NextRequest, NextResponse } from "next/server";

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
    const isAdmin = username === expectedUsername && password === expectedPassword;

    const response = NextResponse.json({
      success: true,
      message: isAdmin ? "Login admin berhasil." : "Login berhasil.",
      role: isAdmin ? "admin" : "student",
      redirectTo: isAdmin ? "/admin" : "/",
    });

    const tokenValue = Buffer.from(
      JSON.stringify({
        username,
        role: isAdmin ? "admin" : "student",
        timestamp: Date.now(),
      }),
    ).toString("base64");

    response.cookies.set({
      name: "cbt_admin_session",
      value: isAdmin ? tokenValue : "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: isAdmin ? 60 * 60 * 24 * 7 : 0,
      path: "/",
    });

    response.cookies.set({
      name: "cbt_user_session",
      value: tokenValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
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
