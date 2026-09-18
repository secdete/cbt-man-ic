import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: {
          include: {
            questions: true,
          },
        },
        submissions: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Sesi ujian tidak ditemukan.' },
        { status: 404 }
      );
    }

    if (session.status === 'COMPLETED') {
      return NextResponse.json({
        success: true,
        message: 'Ujian sudah diselesaikan sebelumnya.',
        data: { sessionId: session.id },
      });
    }

    const questions = session.exam.questions;
    const submissionMap = new Map<string, string | null>();
    session.submissions.forEach((sub) => {
      submissionMap.set(sub.questionId, sub.selectedOption);
    });

    let correctCount = 0;
    let incorrectCount = 0;
    let unansweredCount = 0;
    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const q of questions) {
      maxPossibleScore += q.points;
      const studentAns = submissionMap.get(q.id);

      if (!studentAns) {
        unansweredCount++;
        // Update submission status jika ada
        await prisma.answerSubmission.upsert({
          where: { sessionId_questionId: { sessionId, questionId: q.id } },
          create: {
            sessionId,
            questionId: q.id,
            selectedOption: null,
            isCorrect: false,
          },
          update: {
            isCorrect: false,
          },
        });
      } else {
        const isCorrect = studentAns.toUpperCase() === q.correctAnswer.toUpperCase();
        if (isCorrect) {
          correctCount++;
          totalScore += q.points;
        } else {
          incorrectCount++;
        }

        await prisma.answerSubmission.update({
          where: { sessionId_questionId: { sessionId, questionId: q.id } },
          data: { isCorrect },
        });
      }
    }

    // Hitung persentase akurasi (skala 0 - 100)
    const accuracy = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    const updatedSession = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status: 'COMPLETED',
        endTime: new Date(),
        totalScore,
        correctCount,
        incorrectCount,
        unansweredCount,
        accuracy: parseFloat(accuracy.toFixed(2)),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Ujian berhasil diselesaikan!',
      data: {
        sessionId: updatedSession.id,
        totalScore,
        maxPossibleScore,
        accuracy: updatedSession.accuracy,
        correctCount,
        incorrectCount,
        unansweredCount,
      },
    });
  } catch (error: any) {
    console.error('Error submitting exam:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal menyelesaikan ujian.' },
      { status: 500 }
    );
  }
}

