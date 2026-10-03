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
        _count: { select: { sessions: true } },
        sessions: {
          select: { status: true },
          orderBy: { createdAt: "desc" },
        },
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
    const usernameFromClient = sanitize(body?.username);
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

    // Username hasil turunan nama bisa bentrok saat dua peserta punya nama serupa,
    // jadi beri akhiran angka sampai benar-benar unik.
    let username = usernameFromClient;
    if (username) {
      const owner = await prisma.student.findUnique({ where: { username } });
      if (owner) {
        return NextResponse.json(
          { success: false, message: `Username "${username}" sudah dipakai peserta lain.` },
          { status: 409 },
        );
      }
    } else {
      const base = generateIdentifier(name, phone ?? undefined);
      username = base;
      for (let suffix = 1; await prisma.student.findUnique({ where: { username } }); suffix++) {
        username = `${base.slice(0, 10)}${suffix}`;
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

export async function DELETE(req: NextRequest) {
  try {
    const denied = await requireAdmin(req);
    if (denied) return denied;

    const body = await req.json().catch(() => null);
    const rawIds: unknown[] = Array.isArray(body?.ids) ? body.ids : [];
    const ids = [
      ...new Set(
        rawIds
          .map((id) => String(id ?? "").trim())
          .filter((id) => id.length > 0),
      ),
    ];

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada peserta yang dipilih untuk dihapus." },
        { status: 400 },
      );
    }

    const targets = await prisma.student.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, _count: { select: { sessions: true } } },
    });

    if (targets.length === 0) {
      return NextResponse.json(
        { success: false, message: "Peserta yang dipilih tidak ditemukan." },
        { status: 404 },
      );
    }

    // Riwayat ujian sengaja TIDAK ikut dihapus: relasi ExamSession.studentId memakai
    // onDelete: SetNull, sehingga nilai & laporan hasil tetap bisa dibuka panitia.
    const sessionCount = targets.reduce((sum, s) => sum + s._count.sessions, 0);
    await prisma.student.deleteMany({ where: { id: { in: targets.map((s) => s.id) } } });

    const label = targets.length === 1 ? `"${targets[0].name}"` : `${targets.length} peserta`;
    const history =
      sessionCount > 0
        ? ` ${sessionCount} riwayat ujian tetap tersimpan di laporan hasil.`
        : "";

    return NextResponse.json({
      success: true,
      deletedCount: targets.length,
      sessionCount,
      message: `${label} dihapus.${history}`,
    });
  } catch (error) {
    console.error("Delete student failed:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menghapus peserta." },
      { status: 500 },
    );
  }
}
