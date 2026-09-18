import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
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
            questions: {
              orderBy: { questionNumber: 'asc' },
            },
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

    const subMap = new Map<string, { selectedOption: string | null; isDoubtful: boolean; isCorrect: boolean | null }>();
    session.submissions.forEach((s) => {
      subMap.set(s.questionId, {
        selectedOption: s.selectedOption,
        isDoubtful: s.isDoubtful,
        isCorrect: s.isCorrect,
      });
    });

    // Breakdown per subtes
    const subjectStats: Record<string, { total: number; correct: number; points: number }> = {};

    const reviewQuestions = session.exam.questions.map((q) => {
      const sub = subMap.get(q.id);
      const studentAns = sub?.selectedOption || null;
      const isCorrect = studentAns !== null && studentAns.toUpperCase() === q.correctAnswer.toUpperCase();
      const subject = q.subject || 'Umum';

      if (!subjectStats[subject]) {
        subjectStats[subject] = { total: 0, correct: 0, points: 0 };
      }
      subjectStats[subject].total += 1;
      if (isCorrect) {
        subjectStats[subject].correct += 1;
        subjectStats[subject].points += q.points;
      }

      return {
        id: q.id,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        optionA: q.optionA,
        optionB: q.optionB,
        optionC: q.optionC,
        optionD: q.optionD,
        optionE: q.optionE,
        correctAnswer: q.correctAnswer,
        studentAnswer: studentAns,
        isCorrect,
        isDoubtful: sub?.isDoubtful || false,
        explanation: q.explanation,
        subject: q.subject,
        points: q.points,
      };
    });

    const maxPossibleScore = session.exam.questions.reduce((acc, curr) => acc + curr.points, 0);
    const isPassed = session.totalScore >= session.exam.passingScore;

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          studentName: session.studentName,
          studentNisn: session.studentNisn,
          studentSchool: session.studentSchool,
          startTime: session.startTime,
          endTime: session.endTime,
          totalScore: session.totalScore,
          maxPossibleScore,
          passingScore: session.exam.passingScore,
          isPassed,
          accuracy: session.accuracy,
          correctCount: session.correctCount,
          incorrectCount: session.incorrectCount,
          unansweredCount: session.unansweredCount,
          tabSwitchCount: session.tabSwitchCount,
        },
        exam: {
          id: session.exam.id,
          title: session.exam.title,
          category: session.exam.category,
          durationMinutes: session.exam.durationMinutes,
        },
        subjectBreakdown: Object.entries(subjectStats).map(([name, stats]) => ({
          subject: name,
          total: stats.total,
          correct: stats.correct,
          points: stats.points,
          percentage: Math.round((stats.correct / stats.total) * 100),
        })),
        questions: reviewQuestions,
      },
    });
  } catch (error: any) {
    console.error('Error fetching result:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil hasil ujian.' },
      { status: 500 }
    );
  }
}

