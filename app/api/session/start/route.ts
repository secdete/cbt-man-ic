import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { token, studentName, studentNisn, studentSchool } = await req.json();

    if (!token || !studentName) {
      return NextResponse.json(
        { success: false, message: "Token Ujian dan Nama Siswa wajib diisi." },
        { status: 400 },
      );
    }

    const cleanToken = token.trim().toUpperCase();

    // Cari ujian berdasarkan token
    const exam = await prisma.exam.findUnique({
      where: { token: cleanToken },
      include: {
        questions: {
          orderBy: { questionNumber: "asc" },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        {
          success: false,
          message: `Token ujian "${cleanToken}" tidak ditemukan atau salah.`,
        },
        { status: 404 },
      );
    }

    if (!exam.isActive) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ujian ini sedang tidak aktif atau telah ditutup oleh panitia.",
        },
        { status: 403 },
      );
    }

    if (exam.questions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Ujian ini belum memiliki butir soal yang diterbitkan.",
        },
        { status: 400 },
      );
    }

    // Cek apakah siswa ini sudah memiliki sesi aktif untuk ujian ini
    let session = await prisma.examSession.findFirst({
      where: {
        examId: exam.id,
        studentName: studentName.trim(),
        status: "IN_PROGRESS",
      },
      include: {
        submissions: true,
      },
    });

    if (!session) {
      // Buat sesi ujian baru
      session = await prisma.examSession.create({
        data: {
          examId: exam.id,
          studentName: studentName.trim(),
          studentNisn: studentNisn ? studentNisn.trim() : null,
          studentSchool: studentSchool ? studentSchool.trim() : null,
          status: "IN_PROGRESS",
          startTime: new Date(),
        },
        include: {
          submissions: true,
        },
      });
    }

    // Hitung sisa waktu ujian (dalam detik)
    const startTimeMs = new Date(session.startTime).getTime();
    const durationMs = exam.durationMinutes * 60 * 1000;
    const nowMs = Date.now();
    const elapsedSeconds = Math.floor((nowMs - startTimeMs) / 1000);
    const totalDurationSeconds = exam.durationMinutes * 60;
    const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);

    if (remainingSeconds <= 0) {
      // Waktu sudah habis
      await prisma.examSession.update({
        where: { id: session.id },
        data: { status: "TIMEOUT", endTime: new Date() },
      });

      return NextResponse.json(
        {
          success: false,
          message: "Waktu ujian untuk sesi Anda telah berakhir.",
          sessionId: session.id,
          isExpired: true,
        },
        { status: 400 },
      );
    }

    // Amankan data butir soal: HAPUS correctAnswer dan explanation sebelum dikirim ke siswa!
    const sanitizedQuestions = exam.questions.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      optionE: q.optionE,
      subject: q.subject,
      points: q.points,
    }));

    // Format jawaban yang sudah tersimpan sebelumnya
    const savedAnswers: Record<
      string,
      { selectedOption: string | null; isDoubtful: boolean }
    > = {};
    for (const sub of session.submissions) {
      savedAnswers[sub.questionId] = {
        selectedOption: sub.selectedOption,
        isDoubtful: sub.isDoubtful,
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        session: {
          id: session.id,
          studentName: session.studentName,
          studentNisn: session.studentNisn,
          studentSchool: session.studentSchool,
          startTime: session.startTime,
          tabSwitchCount: session.tabSwitchCount,
        },
        exam: {
          id: exam.id,
          title: exam.title,
          description: exam.description,
          category: exam.category,
          durationMinutes: exam.durationMinutes,
          passingScore: exam.passingScore,
          totalQuestions: exam.questions.length,
        },
        questions: sanitizedQuestions,
        savedAnswers,
        remainingSeconds,
      },
    });
  } catch (error: any) {
    console.error("Error starting session:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Gagal memulai sesi ujian.",
      },
      { status: 500 },
    );
  }
}
