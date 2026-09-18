import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          select: { id: true, questionNumber: true, points: true, correctAnswer: true },
        },
        sessions: {
          orderBy: { totalScore: 'desc' },
          include: {
            submissions: true,
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json({ success: false, message: 'Ujian tidak ditemukan' }, { status: 404 });
    }

    const totalParticipants = exam.sessions.length;
    const completedSessions = exam.sessions.filter((s) => s.status === 'COMPLETED');
    const averageScore =
      completedSessions.length > 0
        ? completedSessions.reduce((acc, s) => acc + s.totalScore, 0) / completedSessions.length
        : 0;

    const highestScore =
      completedSessions.length > 0
        ? Math.max(...completedSessions.map((s) => s.totalScore))
        : 0;

    const passedCount = completedSessions.filter((s) => s.totalScore >= exam.passingScore).length;

    return NextResponse.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          token: exam.token,
          durationMinutes: exam.durationMinutes,
          passingScore: exam.passingScore,
          totalQuestions: exam.questions.length,
        },
        analytics: {
          totalParticipants,
          completedCount: completedSessions.length,
          averageScore: parseFloat(averageScore.toFixed(1)),
          highestScore,
          passedCount,
          passPercentage: totalParticipants > 0 ? Math.round((passedCount / totalParticipants) * 100) : 0,
        },
        leaderboard: exam.sessions.map((s, index) => ({
          rank: index + 1,
          id: s.id,
          studentName: s.studentName,
          studentNisn: s.studentNisn,
          studentSchool: s.studentSchool,
          status: s.status,
          totalScore: s.totalScore,
          accuracy: s.accuracy,
          correctCount: s.correctCount,
          incorrectCount: s.incorrectCount,
          unansweredCount: s.unansweredCount,
          tabSwitchCount: s.tabSwitchCount,
          startTime: s.startTime,
          endTime: s.endTime,
          isPassed: s.totalScore >= exam.passingScore,
        })),
      },
    });
  } catch (error: any) {
    console.error('Error fetching admin results:', error);
    return NextResponse.json({ success: false, message: 'Gagal mengambil rekap nilai' }, { status: 500 });
  }
}

