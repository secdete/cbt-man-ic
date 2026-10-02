import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const adminSession = req.cookies.get(ADMIN_SESSION_COOKIE);
  const userSession = req.cookies.get("cbt_user_session");

  // Cookie admin hanya dianggap sah jika signature HMAC-nya cocok.
  if (await verifyAdminSession(adminSession?.value)) {
    return NextResponse.json({ authenticated: true, role: "admin" });
  }

  return NextResponse.json({
    authenticated: Boolean(userSession && userSession.value),
    role: userSession && userSession.value ? "student" : null,
  });
}
