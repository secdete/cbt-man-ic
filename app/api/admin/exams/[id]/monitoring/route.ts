import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { id } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          select: {
            id: true,
            questionNumber: true,
            points: true,
            correctAnswer: true,
          },
        },
        subtests: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            questions: {
              select: { id: true, questionNumber: true, points: true, correctAnswer: true },
            },
          },
        },
        sessions: {
          orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
          include: {
            submissions: {
              select: {
                id: true,
                questionId: true,
                selectedOption: true,
                isDoubtful: true,
                answeredAt: true,
              },
            },
          },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, message: "Paket ujian tidak ditemukan." },
        { status: 404 },
      );
    }

    const now = Date.now();
    const totalQuestions =
      exam.questions.length +
      exam.subtests.reduce((sum, subtest) => sum + subtest.questions.length, 0);

    const sessionList = exam.sessions.map((s) => {
      const answeredSubmissions = s.submissions.filter(
        (sub) => sub.selectedOption !== null && sub.selectedOption.trim() !== "",
      );
      const answeredCount = answeredSubmissions.length;
      const progressPercent =
        totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

      const startTimeMs = new Date(s.startTime).getTime();
      const elapsedMinutes = Math.max(0, Math.floor((now - startTimeMs) / 60000));
      const remainingMinutes = Math.max(0, exam.durationMinutes - elapsedMinutes);
      const isTimeUp = s.status === "IN_PROGRESS" && elapsedMinutes >= exam.durationMinutes;

      const lastActiveMs = new Date(s.updatedAt).getTime();
      const secondsSinceLastActive = Math.floor((now - lastActiveMs) / 1000);
      const isLiveActive = s.status === "IN_PROGRESS" && secondsSinceLastActive < 120;

      return {
        id: s.id,
        studentName: s.studentName,
        studentNisn: s.studentNisn,
        studentSchool: s.studentSchool || "Siswa Mandiri",
        studentWhatsapp: s.studentWhatsapp || "-",
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
        updatedAt: s.updatedAt,
        answeredCount,
        totalQuestions,
        progressPercent,
        elapsedMinutes,
        remainingMinutes,
        isTimeUp,
        isLiveActive,
        tabSwitchCount: s.tabSwitchCount,
        totalScore: s.totalScore,
        accuracy: s.accuracy,
      };
    });

    const activeCount = sessionList.filter((s) => s.status === "IN_PROGRESS").length;
    const completedCount = sessionList.filter((s) => s.status === "COMPLETED").length;
    const violationCount = sessionList.filter((s) => s.tabSwitchCount > 0).length;

    return NextResponse.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          token: exam.token,
          category: exam.category,
          durationMinutes: exam.durationMinutes,
          passingScore: exam.passingScore,
          totalQuestions,
        },
        stats: {
          totalParticipants: sessionList.length,
          activeCount,
          completedCount,
          violationCount,
        },
        sessions: sessionList,
        serverTime: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Error fetching exam monitoring data:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat data live monitoring." },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { id: examId } = await params;
    const body = await req.json();
    const { action, sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: "Session ID wajib disertakan." },
        { status: 400 },
      );
    }

    if (action === "FORCE_SUBMIT") {
      const session = await prisma.examSession.findUnique({
        where: { id: sessionId },
        include: {
          exam: {
            include: { questions: true, subtests: { select: { questions: true } } },
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
          message: "Sesi ini sudah berstatus selesai sebelumnya.",
        });
      }

      const questions = [
        ...session.exam.questions,
        ...session.exam.subtests.flatMap((subtest) => subtest.questions),
      ];
      const subMap = new Map<string, string | null>();
      session.submissions.forEach((sub) => {
        subMap.set(sub.questionId, sub.selectedOption);
      });

      let correctCount = 0;
      let incorrectCount = 0;
      let unansweredCount = 0;
      let totalScore = 0;
      let maxPossibleScore = 0;
      const correctQuestionIds: string[] = [];

      for (const q of questions) {
        maxPossibleScore += q.points;
        const studentAns = subMap.get(q.id);

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

      const accuracy =
        maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

      const txOperations: any[] = [];

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

      txOperations.push(
        prisma.answerSubmission.updateMany({
          where: {
            sessionId,
            questionId: { notIn: correctQuestionIds },
          },
          data: { isCorrect: false },
        }),
      );

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

      await prisma.$transaction(txOperations);

      return NextResponse.json({
        success: true,
        message: `Sesi ujian ${session.studentName} berhasil dipaksa kumpulkan (Score: ${totalScore}).`,
      });
    }

    if (action === "RESET_VIOLATIONS") {
      await prisma.examSession.update({
        where: { id: sessionId },
        data: { tabSwitchCount: 0 },
      });

      return NextResponse.json({
        success: true,
        message: "Catatan pelanggaran pindah tab berhasil direset menjadi 0.",
      });
    }

    if (action === "RESET_SESSION") {
      await prisma.examSession.delete({
        where: { id: sessionId },
      });

      return NextResponse.json({
        success: true,
        message: "Sesi ujian berhasil dihapus. Siswa dapat memulai ulang.",
      });
    }

    if (action === "ALLOW_REENTRY") {
      const session = await prisma.examSession.findUnique({
        where: { id: sessionId },
        include: { exam: true },
      });

      if (!session) {
        return NextResponse.json(
          { success: false, message: "Sesi ujian tidak ditemukan." },
          { status: 404 },
        );
      }

      if (session.examId !== examId) {
        return NextResponse.json(
          { success: false, message: "Sesi tersebut bukan bagian dari ujian ini." },
          { status: 400 },
        );
      }

      // Sesi dibuka lagi TANPA menyentuh AnswerSubmission: lembar jawaban lama
      // tetap terhubung ke session id yang sama dan kembali terbaca saat masuk.
      const now = new Date();
      const durationMs = session.exam.durationMinutes * 60_000;
      const hasTimeLeft = now.getTime() - session.startTime.getTime() < durationMs;
      const newStartTime = hasTimeLeft ? session.startTime : now;
      const remainingMinutes = Math.max(
        0,
        Math.ceil((durationMs - (now.getTime() - newStartTime.getTime())) / 60_000),
      );

      const notes: string[] = [];
      const examData: { isActive?: boolean; isLocked?: boolean; closeTime?: Date } = {};
      if (!session.exam.isActive) {
        examData.isActive = true;
        notes.push("ujian yang sedang nonaktif ikut dibuka");
      }
      if (session.exam.isLocked) {
        examData.isLocked = false;
        notes.push("kunci ujian ikut dibuka");
      }
      if (session.exam.closeTime && session.exam.closeTime.getTime() <= now.getTime()) {
        const extended = new Date(now.getTime() + durationMs);
        examData.closeTime = extended;
        notes.push(
          `jadwal ujian diperpanjang sampai ${extended.toLocaleString("id-ID", {
            timeZone: "Asia/Jakarta",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })} WIB`,
        );
      }

      const savedCount = await prisma.answerSubmission.count({ where: { sessionId } });

      await prisma.$transaction([
        prisma.examSession.update({
          where: { id: sessionId },
          data: {
            status: "IN_PROGRESS",
            startTime: newStartTime,
            endTime: null,
            totalScore: 0,
            accuracy: 0,
            correctCount: 0,
            incorrectCount: 0,
            unansweredCount: 0,
            tabSwitchCount: 0,
          },
        }),
        // penilaian lama dibersihkan; nilai baru dihitung ulang saat submit
        prisma.answerSubmission.updateMany({
          where: { sessionId },
          data: { isCorrect: null },
        }),
      ]);

      if (Object.keys(examData).length) {
        await prisma.exam.update({ where: { id: session.examId }, data: examData });
        if (examData.closeTime) {
          await prisma.exam.updateMany({
            where: { parentExamId: session.examId },
            data: { closeTime: examData.closeTime },
          });
        }
      }

      return NextResponse.json({
        success: true,
        message:
          `Sesi ${session.studentName} kembali berjalan. ${savedCount} jawaban tersimpan tetap utuh, ` +
          `sisa waktu ${remainingMinutes} menit.` +
          (notes.length ? ` Catatan: ${notes.join("; ")}.` : ""),
      });
    }

    return NextResponse.json(
      { success: false, message: `Aksi '${action}' tidak dikenali.` },
      { status: 400 },
    );
  } catch (error: any) {
    console.error("Error executing proctoring action:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memproses aksi pengawasan." },
      { status: 500 },
    );
  }
}
