import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";
import { phoneForStorage } from "@/lib/phone";
import crypto from "crypto";

export const dynamic = "force-dynamic";

const sanitize = (value: string | null | undefined) =>
  String(value ?? "").trim();

const generateIdentifier = (name: string, phone?: string) => {
  const base = (name || phone || "student")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 12);

  if (base) return base || `student${Date.now()}`;
  return `student${Date.now()}`;
};

const generatePassword = (name: string, phone?: string, nisn?: string) => {
  const raw = (nisn || phone || name).replace(/\D/g, "");
  const suffix = raw.slice(-6) || "2026";
  return `CBT${suffix}`.slice(0, 12);
};

const hashPassword = (password: string, salt: string) =>
  crypto.createHmac("sha256", salt).update(password).digest("hex");

export async function GET(req: NextRequest) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const students = await prisma.student.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        nisn: true,
        username: true,
        email: true,
        school: true,
        phone: true,
        parentWhatsapp: true,
        dreamCity: true,
        registrationTimestamp: true,
        password: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: students });
  } catch (error) {
    console.error("List students failed:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat daftar peserta." },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const body = await req.json();
    const name = sanitize(body?.name);
    const school = sanitize(body?.school);
    const phone = phoneForStorage(body?.phone);
    const email = sanitize(body?.email);
    const parentWhatsapp = sanitize(body?.parentWhatsapp);
    const dreamCity = sanitize(body?.dreamCity);
    const nisnRaw = sanitize(body?.nisn);
    const passwordFromBody = sanitize(body?.password);

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Nama peserta wajib diisi." },
        { status: 400 },
      );
    }

    const nisn = nisnRaw || generateIdentifier(name, phone ?? undefined);
    const username = sanitize(body?.username) || generateIdentifier(name, phone ?? undefined);
    const password = passwordFromBody || generatePassword(name, phone ?? undefined, nisn);
    const salt = crypto.randomBytes(16).toString("hex");

    const existing = await prisma.student.findUnique({ where: { nisn } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: `Peserta dengan NISN/ID "${nisn}" sudah ada.` },
        { status: 409 },
      );
    }

    if (phone) {
      const phoneOwner = await prisma.student.findUnique({ where: { phone } });
      if (phoneOwner) {
        return NextResponse.json(
          {
            success: false,
            message: `Peserta dengan No. HP "${phone}" sudah terdaftar atas nama ${phoneOwner.name}.`,
          },
          { status: 409 },
        );
      }
    }

    const created = await prisma.student.create({
      data: {
        name,
        nisn,
        username,
        email: email || null,
        school: school || null,
        phone: phone || null,
        parentWhatsapp: parentWhatsapp || null,
        dreamCity: dreamCity || null,
        registrationTimestamp: new Date().toISOString(),
        password,
        passwordHash: hashPassword(password, salt),
        salt,
      },
      select: {
        id: true,
        name: true,
        nisn: true,
        username: true,
        email: true,
        school: true,
        phone: true,
        parentWhatsapp: true,
        dreamCity: true,
        registrationTimestamp: true,
        password: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, data: created, message: "Peserta berhasil dibuat." });
  } catch (error) {
    console.error("Create student failed:", error);
    return NextResponse.json(
      { success: false, message: "Gagal membuat peserta baru." },
      { status: 500 },
    );
  }
}
