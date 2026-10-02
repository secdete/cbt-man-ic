import { createHmac, timingSafeEqual } from "node:crypto";

export const STUDENT_SESSION_COOKIE = "cbt_user_session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Kunci sengaja dibedakan dari cookie panitia (lib/admin-auth.ts) supaya cookie
// peserta tidak bisa dipakai membuka /admin dan sebaliknya.
function getSecret(): string {
  return `${process.env.ADMIN_SECRET_KEY || "cakrawala_admin_secret_2025"}:student`;
}

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export function signStudentSession(studentId: string): string {
  const payload = `${Date.now() + SESSION_TTL_MS}.${toBase64Url(studentId)}`;
  return `${payload}.${sign(payload)}`;
}

// Mengembalikan studentId bila cookie valid & belum kedaluwarsa, selain itu null.
export function verifyStudentSession(value: string | null | undefined): string | null {
  if (!value) return null;

  const parts = value.split(".");
  if (parts.length !== 3) return null;

  const [expiresAt, encodedStudentId, signature] = parts;
  const parsedExpiresAt = Number(expiresAt);
  if (!Number.isFinite(parsedExpiresAt) || parsedExpiresAt <= Date.now()) return null;
  if (!encodedStudentId || !signature) return null;

  const expected = sign(`${expiresAt}.${encodedStudentId}`);
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  try {
    return fromBase64Url(encodedStudentId);
  } catch {
    return null;
  }
}
