import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { token, studentName, studentSchool, studentWhatsapp, studentNisn } =
      await req.json();

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

    // 1. Cek status aktif & kunci ujian dari panitia
    if (!exam.isActive || exam.isLocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Ujian ini sedang ditutup atau belum diaktifkan oleh panitia.",
        },
        { status: 403 },
      );
    }

    // 2. Cek jadwal jam buka dan jam tutup ujian
    const now = new Date();
    if (exam.openTime && new Date(exam.openTime) > now) {
      const formattedOpen = new Date(exam.openTime).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return NextResponse.json(
        {
          success: false,
          message: `Ujian belum dibuka. Jadwal pelaksanaan baru dimulai pada: ${formattedOpen}.`,
        },
        { status: 403 },
      );
    }

    if (exam.closeTime && new Date(exam.closeTime) < now) {
      const formattedClose = new Date(exam.closeTime).toLocaleString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return NextResponse.json(
        {
          success: false,
          message: `Waktu pelaksanaan ujian ini telah berakhir pada: ${formattedClose}.`,
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

    // Peserta hanya boleh memiliki satu sesi agar sesi yang sudah selesai
    // tidak dapat dibuka ulang melalui tombol mulai atau browser back.
    const previousSession = await prisma.examSession.findFirst({
      where: {
        examId: exam.id,
        studentName: studentName.trim(),
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true },
    });

    if (previousSession && previousSession.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          success: false,
          message: "Sesi ujian Anda sudah berakhir dan tidak dapat dibuka kembali.",
        },
        { status: 403 },
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
      // Buat nomor sertifikat unik untuk siswa ini
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const certNumber = `CERT-SNPDB/${new Date().getFullYear()}/${cleanToken.replace(/[^A-Z0-9]/g, "")}-${randomSuffix}`;

      // Buat sesi ujian baru
      session = await prisma.examSession.create({
        data: {
          examId: exam.id,
          studentName: studentName.trim(),
          studentSchool: studentSchool ? studentSchool.trim() : null,
          studentWhatsapp: studentWhatsapp ? studentWhatsapp.trim() : null,
          studentNisn: studentNisn ? studentNisn.trim() : null,
          certificateNumber: certNumber,
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
          studentSchool: session.studentSchool,
          studentWhatsapp: session.studentWhatsapp,
          certificateNumber: session.certificateNumber,
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
