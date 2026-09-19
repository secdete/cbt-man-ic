import crypto from "crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const AUTH_SECRET =
  process.env.STUDENT_AUTH_SECRET ||
  "cakrawala-cbt-student-auth-secret-key-2025-super-secure";
export const STUDENT_COOKIE_NAME = "cbt_student_token";

/**
 * Hashes a student's password using Node's native scrypt with a unique cryptographic salt.
 */
export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return { hash, salt };
}

/**
 * Verifies a password against the stored hash and salt.
 */
export function verifyPassword(
  password: string,
  storedHash: string,
  salt: string
): boolean {
  try {
    const computedHash = crypto.scryptSync(password, salt, 64).toString("hex");
    const storedBuf = Buffer.from(storedHash, "hex");
    const computedBuf = Buffer.from(computedHash, "hex");
    if (storedBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(storedBuf, computedBuf);
  } catch (err) {
    return false;
  }
}

export interface StudentSessionPayload {
  id: string;
  nisn: string;
  name: string;
  school?: string | null;
  timestamp: number;
}

/**
 * Generates an HMAC-SHA256 signed session token for a student.
 */
export function createStudentToken(payload: {
  id: string;
  nisn: string;
  name: string;
  school?: string | null;
}): string {
  const data: StudentSessionPayload = {
    ...payload,
    timestamp: Date.now(),
  };
  const jsonStr = JSON.stringify(data);
  const b64Data = Buffer.from(jsonStr).toString("base64url");
  const signature = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(b64Data)
    .digest("base64url");
  return `${b64Data}.${signature}`;
}

/**
 * Verifies and decodes the HMAC-SHA256 signed student session token.
 */
export function verifyStudentToken(
  token: string | undefined | null
): StudentSessionPayload | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [b64Data, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", AUTH_SECRET)
      .update(b64Data)
      .digest("base64url");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length) return null;
    if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;

    const jsonStr = Buffer.from(b64Data, "base64url").toString("utf-8");
    const parsed = JSON.parse(jsonStr) as StudentSessionPayload;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Helper to retrieve student session payload from incoming NextRequest or Next.js cookies()
 */
export async function getStudentFromRequest(
  req?: NextRequest
): Promise<StudentSessionPayload | null> {
  let token: string | undefined;

  if (req) {
    token = req.cookies.get(STUDENT_COOKIE_NAME)?.value;
  } else {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
    } catch {
      token = undefined;
    }
  }

  return verifyStudentToken(token);
}

