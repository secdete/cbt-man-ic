import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/exams - Ambil semua paket ujian
export async function GET() {
  try {
    const exams = await prisma.exam.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            questions: true,
            sessions: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: exams });
  } catch (error: any) {
    console.error('Error fetching exams:', error);
    return NextResponse.json(
      { success: false, message: 'Gagal mengambil daftar ujian' },
      { status: 500 }
    );
  }
}

// POST /api/exams - Buat paket ujian baru beserta butir soalnya
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      category = 'SNPDB MAN IC',
      durationMinutes = 90,
      token,
      passingScore = 65,
      questions = [],
    } = body;

    if (!title || !token) {
      return NextResponse.json(
        { success: false, message: 'Judul dan Token Ujian wajib diisi.' },
        { status: 400 }
      );
    }

    // Pastikan token unik (jadikan uppercase)
    const cleanToken = token.trim().toUpperCase();
    const existing = await prisma.exam.findUnique({
      where: { token: cleanToken },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: `Token "${cleanToken}" sudah digunakan. Silakan gunakan token lain.` },
        { status: 400 }
      );
    }

    const exam = await prisma.exam.create({
      data: {
        title,
        description,
        category,
        durationMinutes: parseInt(durationMinutes, 10) || 90,
        token: cleanToken,
        passingScore: parseInt(passingScore, 10) || 65,
        isActive: true,
        questions: {
          create: questions.map((q: any, index: number) => ({
            questionNumber: q.questionNumber || index + 1,
            questionText: q.questionText || '',
            optionA: q.optionA || '',
            optionB: q.optionB || '',
            optionC: q.optionC || '',
            optionD: q.optionD || '',
            optionE: q.optionE || null,
            correctAnswer: (q.correctAnswer || 'A').toUpperCase(),
            explanation: q.explanation || null,
            subject: q.subject || 'Umum',
            points: parseInt(q.points, 10) || 4,
          })),
        },
      },
      include: {
        questions: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Paket tryout "${exam.title}" berhasil diterbitkan!`,
      data: exam,
    });
  } catch (error: any) {
    console.error('Error creating exam:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Gagal membuat paket ujian.' },
      { status: 500 }
    );
  }
}

