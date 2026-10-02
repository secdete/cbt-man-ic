import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { phoneForStorage } from "@/lib/phone";

export const dynamic = "force-dynamic";

const normalize = (value: unknown) => String(value ?? "").trim();

const normalizeHeader = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");

const getColumn = (row: Record<string, unknown>, ...headers: string[]) => {
  const normalizedHeaders = new Set(headers.map(normalizeHeader));
  const entry = Object.entries(row).find(([key]) => normalizedHeaders.has(normalizeHeader(key)));
  return normalize(entry?.[1]);
};

const formatTimestamp = (value: unknown) =>
  value instanceof Date ? value.toISOString() : normalize(value);

const generateIdentifier = (name: string, phone?: string) => {
  const base = (name || phone || "student")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);

  return base || `student${Date.now()}`;
};

const generatePassword = (name: string, nisn?: string, phone?: string) => {
  const base = (nisn || phone || name).replace(/\D/g, "");
  const suffix = base.slice(-6) || "2026";
  return `CBT${suffix}`.slice(0, 12);
};

const hashPassword = (password: string, salt: string) =>
  crypto.createHmac("sha256", salt).update(password).digest("hex");

export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: "File Excel tidak ditemukan." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, {
      defval: "",
      raw: false,
    });

    if (!rows.length) {
      return NextResponse.json(
        { success: false, message: "File Excel kosong atau tidak memiliki data." },
        { status: 400 },
      );
    }

    const created: Array<{ name: string; nisn: string; username: string; school: string | null; phone: string | null; password: string }> = [];
    const errors: string[] = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const name = getColumn(row, "Nama Siswa", "name", "nama", "full_name", "student_name");
      const email = getColumn(row, "Email address", "email", "email_address");
      const school = getColumn(row, "Asal Sekolah", "school", "sekolah");
      const phone = getColumn(row, "Nomor Whatsapp Aktif Siswa", "phone", "whatsapp", "no_whatsapp", "no_wa", "hp");
      const parentWhatsapp = getColumn(row, "Nomor Whatsapp Aktif Orang TuaWali", "Nomor Whatsapp Aktif Orang Tua/Wali", "parent_whatsapp", "whatsapp_orang_tua");
      const dreamCity = getColumn(row, "Impian Masuk MAN Insan Cendikia kota apa ?", "Impian Masuk MAN Insan Cendikia kota apa?", "dream_city", "kota_impian");
      const timestampValue = Object.entries(row).find(([key]) => normalizeHeader(key) === "timestamp")?.[1];
      const registrationTimestamp = formatTimestamp(timestampValue) || new Date().toISOString();
      const nisn = getColumn(row, "nisn", "nis", "nomor", "number");
      const password = getColumn(row, "password", "pwd", "pass", "kata_sandi");

      if (!name) {
        errors.push(`Baris ${index + 2}: nama peserta kosong.`);
        continue;
      }

      const fallbackIdentifier = phone || email || `${generateIdentifier(name)}${index + 1}`;
      const finalNisn = nisn || fallbackIdentifier;
      const finalPassword = password || generatePassword(name, finalNisn, phone);
      const finalUsername = getColumn(row, "username", "user", "username_siswa") || phone || email || generateIdentifier(name, phone);
      const finalPhone = phoneForStorage(phone);
      const salt = crypto.randomBytes(16).toString("hex");

      try {
        const exists = await prisma.student.findUnique({ where: { nisn: finalNisn } });
        if (exists) {
          errors.push(`Baris ${index + 2}: NISN/ID "${finalNisn}" sudah ada.`);
          continue;
        }

        if (finalPhone) {
          const phoneOwner = await prisma.student.findUnique({ where: { phone: finalPhone } });
          if (phoneOwner) {
            errors.push(
              `Baris ${index + 2}: No. HP "${phone}" sudah terdaftar atas nama ${phoneOwner.name}.`,
            );
            continue;
          }
        }

        await prisma.student.create({
          data: {
            name,
            nisn: finalNisn,
            username: finalUsername,
            email: email || null,
            school: school || null,
            phone: finalPhone,
            parentWhatsapp: parentWhatsapp || null,
            dreamCity: dreamCity || null,
            registrationTimestamp,
            password: finalPassword,
            passwordHash: hashPassword(finalPassword, salt),
            salt,
          },
        });

        created.push({
          name,
          nisn: finalNisn,
          username: finalUsername,
          school: school || null,
          phone: phone || null,
          password: finalPassword,
        });
      } catch (error) {
        errors.push(`Baris ${index + 2}: gagal disimpan (${(error as Error).message}).`);
      }
    }

    return NextResponse.json({
      success: true,
      createdCount: created.length,
      data: created,
      errors,
      message:
        created.length > 0
          ? `Berhasil menambahkan ${created.length} peserta.`
          : "Tidak ada peserta yang ditambahkan.",
    });
  } catch (error) {
    console.error("Import students failed:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengimpor data peserta dari Excel." },
      { status: 500 },
    );
  }
}
