import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const adminSession = req.cookies.get("cbt_admin_session");
  const userSession = req.cookies.get("cbt_user_session");

  return NextResponse.json({
    authenticated: Boolean(
      (adminSession && adminSession.value) || (userSession && userSession.value),
    ),
    role: adminSession && adminSession.value ? "admin" : userSession && userSession.value ? "student" : null,
  });
}
