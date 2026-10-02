import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isAuthorizedAdmin, requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET /api/exams - Ambil daftar paket ujian.
// Token hanya ikut dikirimkan untuk admin atau saat pencarian token eksplisit,
// agar token ujian tidak bocor ke halaman publik.
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token")?.trim().toUpperCase();
    const subtestOptions = req.nextUrl.searchParams.get("subtests") === "true";
    const authorized = await isAuthorizedAdmin(req);

    if (subtestOptions) {
      if (!authorized) {
        return NextResponse.json(
          { success: false, message: "Akses ditolak. Silakan login kembali sebagai admin." },
          { status: 401 },
        );
      }
      const exams = await prisma.exam.findMany({
        where: { parentExamId: null, subtests: { none: {} } },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        include: { _count: { select: { questions: true, sessions: true } } },
      });
      return NextResponse.json({ success: true, data: exams });
    }

    const exams = await prisma.exam.findMany({
      where: {
        parentExamId: null,
        ...(token ? { token } : {}),
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        subtests: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: { id: true, title: true, category: true, durationMinutes: true, _count: { select: { questions: true } } },
        },
        _count: {
          select: {
            questions: true,
            sessions: true,
          },
        },
      },
    });

    const showToken = Boolean(token) || authorized;
    const data = exams.map((exam) => {
      const item: Record<string, unknown> = {
        ...exam,
        _count: {
          ...exam._count,
          questions: exam._count.questions + exam.subtests.reduce((sum, item) => sum + item._count.questions, 0),
        },
      };
      if (!showToken) delete item.token;
      return item;
    });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      { success: false, message: "Gagal mengambil daftar ujian" },
      { status: 500 },
    );
  }
}

// POST /api/exams - Buat paket ujian baru beserta butir soalnya (khusus admin)
export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const {
      title,
      description,
      category = "SNPDB MAN IC",
      durationMinutes = 90,
      token,
      passingScore = 65,
      questions = [],
      subtestIds = [],
    } = body;

    if (!title || !token) {
      return NextResponse.json(
        { success: false, message: "Judul dan Token Ujian wajib diisi." },
        { status: 400 },
      );
    }

    // Pastikan token unik (jadikan uppercase)
    const cleanToken = token.trim().toUpperCase();
    if (!Array.isArray(questions) || !Array.isArray(subtestIds) || (!questions.length && !subtestIds.length)) {
      return NextResponse.json(
        { success: false, message: "Paket harus berisi soal atau memilih minimal satu subtest." },
        { status: 400 },
      );
    }

    const existing = await prisma.exam.findUnique({
      where: { token: cleanToken },
    });

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: `Token "${cleanToken}" sudah digunakan. Silakan gunakan token lain.`,
        },
        { status: 400 },
      );
    }

    const sourceExams = subtestIds.length
      ? await prisma.exam.findMany({
          where: { id: { in: subtestIds }, parentExamId: null, subtests: { none: {} } },
          select: { id: true, title: true },
        })
      : [];
    if (sourceExams.length !== subtestIds.length) {
      return NextResponse.json(
        { success: false, message: "Subtest tidak tersedia atau sudah menjadi bagian dari paket lain." },
        { status: 400 },
      );
    }

    const exam = await prisma.$transaction(async (tx) => {
      const created = await tx.exam.create({
        data: {
          title,
          description,
          category,
          durationMinutes: parseInt(durationMinutes, 10) || 90,
          token: cleanToken,
          passingScore: parseInt(passingScore, 10) || 65,
          isActive: true,
          questions: {
            create: questions.map((q: any, index: number) => ({
            questionNumber: q.questionNumber || index + 1,
            questionText: q.questionText || "",
            optionA: q.optionA || "",
            optionB: q.optionB || "",
            optionC: q.optionC || "",
            optionD: q.optionD || "",
            optionE: q.optionE || null,
            correctAnswer: (q.correctAnswer || "A").toUpperCase(),
            explanation: q.explanation || null,
            subject: q.subject || "Umum",
            points: parseInt(q.points, 10) || 4,
          })),
          },
          subtests: { connect: subtestIds.map((id: string) => ({ id })) },
        },
      });
      if (subtestIds.length) {
        // Urutan pemilihan subtest di panel admin menjadi urutan seksi di paket.
        await Promise.all(
          subtestIds.map((id: string, index: number) =>
            tx.exam.update({
              where: { id },
              data: { isActive: false, isLocked: true, sortOrder: index },
            }),
          ),
        );
      }
      return created;
    });

    return NextResponse.json({
      success: true,
      message: `Paket tryout "${exam.title}" berhasil diterbitkan!`,
      data: exam,
    });
  } catch (error: any) {
    console.error("Error creating exam:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Gagal membuat paket ujian.",
      },
      { status: 500 },
    );
  }
}
