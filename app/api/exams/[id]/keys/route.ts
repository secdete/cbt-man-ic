import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const exam = await prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        category: true,
        questions: {
          orderBy: { questionNumber: "asc" },
          select: {
            id: true,
            questionNumber: true,
            questionText: true,
            optionA: true,
            optionB: true,
            optionC: true,
            optionD: true,
            optionE: true,
            correctAnswer: true,
            subject: true,
            points: true,
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

    return NextResponse.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          category: exam.category,
        },
        questions: exam.questions,
      },
    });
  } catch (error: any) {
    console.error("Error fetching exam keys:", error);
    return NextResponse.json(
      { success: false, message: "Gagal memuat kunci jawaban ujian." },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { keys } = body; // Array<{ id: string; correctAnswer: string }>

    if (!Array.isArray(keys) || keys.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Data kunci jawaban tidak valid atau kosong.",
        },
        { status: 400 },
      );
    }

    // Validasi dan siapkan operasi update
    const validKeys = ["A", "B", "C", "D", "E"];
    const updateOperations = [];

    for (const item of keys) {
      if (!item.id || !item.correctAnswer) continue;
      const upper = String(item.correctAnswer).trim().toUpperCase();
      if (!validKeys.includes(upper)) continue;

      updateOperations.push(
        prisma.question.update({
          where: { id: item.id },
          data: { correctAnswer: upper },
        }),
      );
    }

    if (updateOperations.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Tidak ada data kunci valid yang dapat diperbarui.",
        },
        { status: 400 },
      );
    }

    await prisma.$transaction(updateOperations);

    return NextResponse.json({
      success: true,
      message: `Berhasil memperbarui ${updateOperations.length} kunci jawaban!`,
      count: updateOperations.length,
    });
  } catch (error: any) {
    console.error("Error updating exam keys:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan kunci jawaban ke server." },
      { status: 500 },
    );
  }
}
