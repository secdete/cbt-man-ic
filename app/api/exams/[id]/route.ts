import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { questionNumber: "asc" },
        },
        subtests: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: { questions: { orderBy: { questionNumber: "asc" } } },
        },
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, message: "Paket ujian tidak ditemukan" },
        { status: 404 },
      );
    }

    const allQuestions = [
      ...exam.questions.map((question) => ({ ...question, packageSubject: null as string | null })),
      ...exam.subtests.flatMap((subtest) =>
        subtest.questions.map((question) => ({ ...question, packageSubject: subtest.title })),
      ),
    ];
    const sanitizedQuestions = allQuestions.map((question, index) => ({
      id: question.id,
      questionNumber: index + 1,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      optionE: question.optionE,
      subject: question.subject && question.subject !== "Umum"
        ? question.subject
        : question.packageSubject || question.subject,
      points: question.points,
    }));

    return NextResponse.json({
      success: true,
      data: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        category: exam.category,
        durationMinutes: exam.durationMinutes,
        passingScore: exam.passingScore,
        questions: sanitizedQuestions,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil detail ujian" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    const exam = await prisma.exam.findUnique({
      where: { id },
      select: { subtests: { select: { id: true } } },
    });

    await prisma.exam.delete({
      where: { id },
    });

    // Subtest yang terhapus dari paket dikembalikan sebagai naskah mandiri
    // agar bisa digabung lagi ke paket lain oleh admin.
    if (exam?.subtests.length) {
      await prisma.exam.updateMany({
        where: { id: { in: exam.subtests.map((subtest) => subtest.id) } },
        data: { isActive: true, isLocked: false },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Paket ujian berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal menghapus ujian" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();

    const current = await prisma.exam.findUnique({
      where: { id },
      select: { openTime: true, closeTime: true, isActive: true, isLocked: true, subtests: { select: { id: true } } },
    });
    if (!current) {
      return NextResponse.json({ success: false, message: "Paket ujian tidak ditemukan." }, { status: 404 });
    }
    const openTime = body.openTime !== undefined
      ? (body.openTime ? new Date(body.openTime) : null)
      : current.openTime;
    const closeTime = body.closeTime !== undefined
      ? (body.closeTime ? new Date(body.closeTime) : null)
      : current.closeTime;
    if ((openTime && Number.isNaN(openTime.getTime())) || (closeTime && Number.isNaN(closeTime.getTime()))) {
      return NextResponse.json({ success: false, message: "Tanggal jadwal ujian tidak valid." }, { status: 400 });
    }
    if (openTime && closeTime && closeTime <= openTime) {
      return NextResponse.json({ success: false, message: "Waktu selesai harus sesudah waktu mulai." }, { status: 400 });
    }

    const updated = await prisma.exam.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        durationMinutes: body.durationMinutes
          ? parseInt(body.durationMinutes, 10)
          : undefined,
        passingScore: body.passingScore
          ? parseInt(body.passingScore, 10)
          : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
        isLocked: body.isLocked !== undefined ? body.isLocked : undefined,
        openTime: body.openTime !== undefined ? openTime : undefined,
        closeTime: body.closeTime !== undefined ? closeTime : undefined,
      },
    });

    if (body.openTime !== undefined || body.closeTime !== undefined) {
      if (current.subtests.length) {
        await prisma.exam.updateMany({
          where: { parentExamId: id },
          data: { openTime, closeTime },
        });
      }
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui ujian" },
      { status: 500 },
    );
  }
}
