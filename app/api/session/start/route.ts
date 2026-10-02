import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { STUDENT_SESSION_COOKIE, verifyStudentSession } from "@/lib/student-auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();

    if (!token || !String(token).trim()) {
      return NextResponse.json(
        { success: false, message: "Token Ujian wajib diisi." },
        { status: 400 },
      );
    }

    // Identitas peserta diambil dari sesi login, bukan dari formulir.
    // Dengan begini peserta lain tidak bisa memakai No. HP orang untuk mengerjakan.
    const studentId = verifyStudentSession(req.cookies.get(STUDENT_SESSION_COOKIE)?.value);
    if (!studentId) {
      return NextResponse.json(
        { success: false, message: "Silakan login terlebih dahulu sebelum memulai ujian." },
        { status: 401 },
      );
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return NextResponse.json(
        { success: false, message: "Akun Anda tidak ditemukan. Silakan login kembali." },
        { status: 401 },
      );
    }

    const cleanToken = token.trim().toUpperCase();

    // Cari ujian berdasarkan token
    const exam = await prisma.exam.findFirst({
      where: { token: cleanToken },
      include: {
        questions: {
          orderBy: { questionNumber: "asc" },
        },
        subtests: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          include: { questions: { orderBy: { questionNumber: "asc" } } },
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
          message: "Ujian ini sedang ditutup atau belum diaktifkan oleh panitia.",
        },
        { status: 403 },
      );
    }

    if (exam.parentExamId) {
      return NextResponse.json(
        { success: false, message: "Subtest ini telah digabung. Gunakan token paket tryout." },
        { status: 403 },
      );
    }

    // 2. Cek jadwal jam buka dan jam tutup ujian (dikontrol penuh oleh admin)
    const now = new Date();
    if (exam.openTime && new Date(exam.openTime) > now) {
      const formattedOpen = new Date(exam.openTime).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
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

    const scheduleExpired = Boolean(exam.closeTime && exam.closeTime <= now);

    const allQuestions = [
      ...exam.questions.map((question) => ({ ...question, packageSubject: null as string | null })),
      ...exam.subtests.flatMap((subtest) =>
        subtest.questions.map((question) => ({ ...question, packageSubject: subtest.title })),
      ),
    ];
    if (allQuestions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Ujian ini belum memiliki butir soal yang diterbitkan.",
        },
        { status: 400 },
      );
    }

    // 3. Satu sesi per peserta per paket try out (kunci: akun yang sedang login).
    const attemptKey = `${exam.id}:student:${student.id}`;
    const previousSession = await prisma.examSession.findFirst({
      where: {
        examId: exam.id,
        OR: [{ attemptKey }, { studentId: student.id }],
      },
      orderBy: { createdAt: "desc" },
      select: { id: true, status: true },
    });

    if (previousSession && previousSession.status !== "IN_PROGRESS") {
      return NextResponse.json(
        {
          success: false,
          message: "Tryout ini hanya berlaku satu kali pengerjaan. Sesi Anda sudah diselesaikan dan tidak dapat dibuka kembali.",
        },
        { status: 403 },
      );
    }

    // Cek apakah siswa ini sudah memiliki sesi aktif untuk ujian ini
    let session = previousSession
      ? await prisma.examSession.findUnique({
          where: { id: previousSession.id },
          include: { submissions: true },
        })
      : null;

    if (scheduleExpired && !session) {
      const formattedClose = new Date(exam.closeTime!).toLocaleString("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      return NextResponse.json(
        { success: false, message: `Waktu pelaksanaan ujian ini telah berakhir pada: ${formattedClose}.` },
        { status: 403 },
      );
    }

    if (!session) {
      // Nomor sertifikat deterministik per peserta agar tidak pernah bentrok
      const certSuffix = student.id.replace(/-/g, "").slice(0, 6).toUpperCase();
      const certNumber = `CERT-SNPDB/${new Date().getFullYear()}/${cleanToken.replace(/[^A-Z0-9]/g, "")}-${certSuffix}`;

      try {
        session = await prisma.examSession.create({
          data: {
            examId: exam.id,
            studentId: student.id,
            studentName: student.name,
            studentSchool: student.school,
            studentWhatsapp: student.phone,
            certificateNumber: certNumber,
            attemptKey,
            status: "IN_PROGRESS",
            startTime: new Date(),
          },
          include: { submissions: true },
        });
      } catch (createError: any) {
        if (createError?.code !== "P2002") throw createError;
        const existing = await prisma.examSession.findUnique({
          where: { attemptKey },
          include: { submissions: true },
        });
        if (!existing) throw createError;
        if (existing.status !== "IN_PROGRESS") {
          return NextResponse.json(
            { success: false, message: "Tryout ini hanya berlaku satu kali pengerjaan. Sesi Anda sudah diselesaikan." },
            { status: 403 },
          );
        }
        session = existing;
      }
    }

    // Hitung sisa waktu ujian (dalam detik)
    const startTimeMs = new Date(session.startTime).getTime();
    const nowMs = Date.now();
    const elapsedSeconds = Math.floor((nowMs - startTimeMs) / 1000);
    const totalDurationSeconds = exam.durationMinutes * 60;
    const durationRemaining = totalDurationSeconds - elapsedSeconds;
    const scheduleRemaining = exam.closeTime
      ? Math.floor((new Date(exam.closeTime).getTime() - nowMs) / 1000)
      : durationRemaining;
    const remainingSeconds = Math.max(0, Math.min(durationRemaining, scheduleRemaining));

    // Amankan data butir soal: HAPUS correctAnswer dan explanation sebelum dikirim ke siswa!
    const sanitizedQuestions = allQuestions.map((q, index) => ({
      id: q.id,
      questionNumber: index + 1,
      questionText: q.questionText,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      optionE: q.optionE,
      subject: q.subject && q.subject !== "Umum" ? q.subject : q.packageSubject || q.subject,
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
          totalQuestions: allQuestions.length,
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
