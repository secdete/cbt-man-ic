import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await req.json();
    const { questionId, selectedOption, isDoubtful = false } = body;

    if (!questionId) {
      return NextResponse.json(
        { success: false, message: 'ID soal wajib disertakan.' },
        { status: 400 }
      );
    }

    // Pastikan sesi masih berlangsung
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { exam: { select: { id: true, isActive: true, isLocked: true, closeTime: true, subtests: { select: { id: true } } } } },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Sesi ujian tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (session.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { success: false, message: 'Sesi ujian ini telah selesai dan tidak dapat diubah lagi.' },
        { status: 400 }
      );
    }

    // Penguncian manual (isLocked) tetap memblokir. Status nonaktif (isActive)
    // TIDAK: toggle status oleh panitia pernah diam-diam membuang semua jawaban
    // peserta yang sedang berjalan — sesi yang sudah berjalan tetap boleh menyimpan.
    if (session.exam.isLocked) {
      return NextResponse.json(
        { success: false, message: "Ujian telah dikunci oleh panitia. Jawaban tidak dapat diubah." },
        { status: 403 },
      );
    }

    const now = new Date();
    if (session.exam.closeTime && now >= session.exam.closeTime) {
      return NextResponse.json(
        { success: false, message: "Waktu ujian telah berakhir. Jawaban tidak dapat diubah." },
        { status: 403 },
      );
    }

    const allowedExamIds = [session.exam.id, ...session.exam.subtests.map((subtest) => subtest.id)];
    const question = await prisma.question.findFirst({
      where: { id: questionId, examId: { in: allowedExamIds } },
      select: { id: true },
    });
    if (!question) {
      return NextResponse.json({ success: false, message: "Soal tidak termasuk dalam paket tryout ini." }, { status: 400 });
    }

    // Upsert submission
    const submission = await prisma.answerSubmission.upsert({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId,
        },
      },
      create: {
        sessionId,
        questionId,
        selectedOption: selectedOption || null,
        isDoubtful: Boolean(isDoubtful),
        answeredAt: new Date(),
      },
      update: {
        selectedOption: selectedOption || null,
        isDoubtful: Boolean(isDoubtful),
        answeredAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: submission,
    });
  } catch (error: any) {
    console.error('Error auto-saving answer:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyimpan jawaban.' },
      { status: 500 }
    );
  }
}
