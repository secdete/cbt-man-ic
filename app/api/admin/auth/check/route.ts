import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get("cbt_admin_session");
  return NextResponse.json({
    authenticated: Boolean(sessionCookie && sessionCookie.value),
  });
}
