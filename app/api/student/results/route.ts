import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { STUDENT_SESSION_COOKIE, verifyStudentSession } from "@/lib/student-auth";

export const dynamic = "force-dynamic";

// Total nilai maksimal tiap paket dihitung sekali per ujian, bukan per sesi.
const maxScoreCache = new Map<string, number>();

function maxScoreFor(exam: {
  id: string;
  questions: { points: number }[];
  subtests: { questions: { points: number }[] }[];
}) {
  const cached = maxScoreCache.get(exam.id);
  if (cached !== undefined) return cached;

  const total =
    exam.questions.reduce((sum, q) => sum + q.points, 0) +
    exam.subtests.reduce(
      (sum, subtest) => sum + subtest.questions.reduce((inner, q) => inner + q.points, 0),
      0,
    );

  maxScoreCache.set(exam.id, total);
  return total;
}

// Dashboard hasil milik peserta yang sedang login: daftar seluruh attempt
// beserta nilai, status kelulusan, dan nomor sertifikat.
export async function GET(req: NextRequest) {
  try {
    const studentId = verifyStudentSession(req.cookies.get(STUDENT_SESSION_COOKIE)?.value);
    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu." },
        { status: 401 },
      );
    }

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, school: true, nisn: true, username: true },
    });
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Akun tidak ditemukan. Silakan login kembali." },
        { status: 401 },
      );
    }

    const identityKeys = [student.nisn, student.username].filter(
      (value): value is string => Boolean(value && value.trim()),
    );

    const sessions = await prisma.examSession.findMany({
      where: {
        OR: [
          { studentId: student.id },
          // Sesi lama sebelum studentId diisi: cocokkan lewat identitas saat mendaftar.
          ...(identityKeys.length
            ? identityKeys.map((key) => ({ studentId: null, studentNisn: key }))
            : []),
        ],
      },
      orderBy: { startTime: "desc" },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
        totalScore: true,
        accuracy: true,
        correctCount: true,
        incorrectCount: true,
        unansweredCount: true,
        certificateNumber: true,
        createdAt: true,
        exam: {
          select: {
            id: true,
            token: true,
            title: true,
            category: true,
            durationMinutes: true,
            passingScore: true,
            questions: { select: { points: true } },
            subtests: { select: { questions: { select: { points: true } } } },
          },
        },
      },
    });

    const results = await Promise.all(
      sessions.map(async (session) => {
        const { questions, subtests, ...examMeta } = session.exam;
        const maxPossibleScore = maxScoreFor(session.exam);
        const finished = session.status === "COMPLETED" || session.status === "TIMEOUT";

        return {
          id: session.id,
          status: session.status,
          finished,
          startTime: session.startTime,
          endTime: session.endTime,
          createdAt: session.createdAt,
          totalScore: session.totalScore,
          maxPossibleScore,
          passingScore: examMeta.passingScore,
          isPassed: finished ? session.totalScore >= examMeta.passingScore : null,
          accuracy: session.accuracy,
          correctCount: session.correctCount,
          incorrectCount: session.incorrectCount,
          unansweredCount: session.unansweredCount,
          certificateNumber: session.certificateNumber,
          exam: {
            id: examMeta.id,
            token: examMeta.token,
            title: examMeta.title,
            category: examMeta.category,
            durationMinutes: examMeta.durationMinutes,
          },
        };
      }),
    );

    return NextResponse.json({
      success: true,
      data: {
        student: { id: student.id, name: student.name, school: student.school },
        results,
      },
    });
  } catch (error) {
    console.error("Load student results failed:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat hasil ujian Anda." },
      { status: 500 },
    );
  }
}
