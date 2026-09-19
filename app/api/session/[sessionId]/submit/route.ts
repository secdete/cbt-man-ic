import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
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
        { success: false, message: "Sesi ujian tidak ditemukan." },
        { status: 404 },
      );
    }

    if (session.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        message: "Ujian sudah diselesaikan sebelumnya.",
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

    const correctQuestionIds: string[] = [];

    for (const q of questions) {
      maxPossibleScore += q.points;
      const studentAns = submissionMap.get(q.id);

      if (!studentAns) {
        unansweredCount++;
      } else {
        const isCorrect =
          studentAns.toUpperCase() === q.correctAnswer.toUpperCase();
        if (isCorrect) {
          correctCount++;
          totalScore += q.points;
          correctQuestionIds.push(q.id);
        } else {
          incorrectCount++;
        }
      }
    }

    // Hitung persentase akurasi (skala 0 - 100)
    const accuracy =
      maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    // Batch database operations dengan prisma.$transaction agar instan dalam 1 round-trip (bukan 70x query)
    const txOperations: any[] = [];

    // Tandai jawaban benar
    if (correctQuestionIds.length > 0) {
      txOperations.push(
        prisma.answerSubmission.updateMany({
          where: {
            sessionId,
            questionId: { in: correctQuestionIds },
          },
          data: { isCorrect: true },
        }),
      );
    }

    // Tandai jawaban yang salah atau belum benar
    txOperations.push(
      prisma.answerSubmission.updateMany({
        where: {
          sessionId,
          questionId: { notIn: correctQuestionIds },
        },
        data: { isCorrect: false },
      }),
    );

    // Update status sesi ujian menjadi COMPLETED
    txOperations.push(
      prisma.examSession.update({
        where: { id: sessionId },
        data: {
          status: "COMPLETED",
          endTime: new Date(),
          totalScore,
          correctCount,
          incorrectCount,
          unansweredCount,
          accuracy: parseFloat(accuracy.toFixed(2)),
        },
      }),
    );

    const txResults = await prisma.$transaction(txOperations);
    const updatedSession = txResults[txResults.length - 1];

    return NextResponse.json({
      success: true,
      message: "Ujian berhasil diselesaikan!",
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
    console.error("Error submitting exam:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyelesaikan ujian." },
      { status: 500 },
    );
  }
}
