import { NextResponse } from "next/server";
import { STUDENT_COOKIE_NAME } from "@/lib/student-auth";

export const dynamic = "force-dynamic";

export async function POST() {
  const response = NextResponse.json({
    success: true,
    message: "Logout berhasil.",
  });

  response.cookies.delete(STUDENT_COOKIE_NAME);

  return response;
}
