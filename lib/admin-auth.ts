import { NextRequest, NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "cbt_admin_session";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  return process.env.ADMIN_SECRET_KEY || "cakrawala_admin_secret_2025";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded.padEnd(padded.length + ((4 - (padded.length % 4)) % 4), "="));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function sign(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return toBase64Url(new Uint8Array(digest));
}

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function signAdminSession(username: string): Promise<string> {
  const payload = `${Date.now() + SESSION_TTL_MS}.${toBase64Url(new TextEncoder().encode(username))}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyAdminSession(value: string | null | undefined): Promise<boolean> {
  if (!value) return false;
  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const [expiresAt, encodedUsername, signature] = parts;
  const parsedExpiresAt = Number(expiresAt);
  if (!Number.isFinite(parsedExpiresAt) || parsedExpiresAt <= Date.now()) return false;
  if (!encodedUsername || !signature) return false;

  try {
    fromBase64Url(encodedUsername);
  } catch {
    return false;
  }

  return safeEqual(await sign(`${expiresAt}.${encodedUsername}`), signature);
}

export async function isAuthorizedAdmin(req: NextRequest | Request): Promise<boolean> {
  const cookieHeader = req.headers.get("cookie");
  if (!cookieHeader) return false;

  const match = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  if (!match) return false;
  return verifyAdminSession(decodeURIComponent(match.slice(ADMIN_SESSION_COOKIE.length + 1)));
}

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const value = req.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (await verifyAdminSession(value)) return null;
  return NextResponse.json(
    { success: false, message: "Akses ditolak. Silakan login kembali sebagai admin." },
    { status: 401 },
  );
}
