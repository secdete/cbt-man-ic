import { createHmac, scryptSync, timingSafeEqual } from "node:crypto";

// Data peserta datang dari dua jalur dengan algoritma hash berbeda:
// - pendaftaran lewat form ujian (session/start): scrypt, `password` kosong
// - impor Excel / panel admin: HMAC-SHA256(salt, password), `password` terisi
// Keduanya diverifikasi di sini supaya peserta impor bisa masuk ujian dan login.
const SCRYPT_OPTIONS = { N: 8192, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

type StudentSecret = {
  password: string;
  passwordHash: string;
  salt: string;
};

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64, SCRYPT_OPTIONS).toString("hex");
}

function equalHex(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
}

export function verifyStudentPassword(input: string, student: StudentSecret): boolean {
  if (!student.salt || !student.passwordHash) return false;

  const actual = student.password
    ? createHmac("sha256", student.salt).update(input).digest("hex")
    : hashPassword(input, student.salt);

  return equalHex(actual, student.passwordHash);
}
