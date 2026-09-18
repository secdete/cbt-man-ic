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

