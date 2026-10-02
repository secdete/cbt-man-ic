import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

// Kunci jawaban & pembahasan hanya boleh diakses panitia (admin login).
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
            explanation: true,
          },
        },
        subtests: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            title: true,
            questions: {
              orderBy: { questionNumber: "asc" },
              select: {
                id: true, questionNumber: true, questionText: true,
                optionA: true, optionB: true, optionC: true, optionD: true,
                optionE: true, correctAnswer: true, subject: true,
                points: true, explanation: true,
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

    return NextResponse.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          title: exam.title,
          category: exam.category,
        },
        questions: [
          ...exam.questions,
          ...exam.subtests.flatMap((subtest) =>
            subtest.questions.map((question) => ({
              ...question,
              subject: question.subject && question.subject !== "Umum" ? question.subject : subtest.title,
            })),
          ),
        ].map((question, index) => ({ ...question, questionNumber: index + 1 })),
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
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await req.json();
    const { keys } = body; // Array<{ id: string; correctAnswer?: string; explanation?: string | null }>

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
      if (!item.id) continue;

      const dataToUpdate: { correctAnswer?: string; explanation?: string | null } = {};

      if (item.correctAnswer) {
        const upper = String(item.correctAnswer).trim().toUpperCase();
        if (validKeys.includes(upper)) {
          dataToUpdate.correctAnswer = upper;
        }
      }

      if (item.explanation !== undefined) {
        dataToUpdate.explanation = item.explanation ? String(item.explanation).trim() : null;
      }

      if (Object.keys(dataToUpdate).length > 0) {
        updateOperations.push(
          prisma.question.update({
            where: { id: item.id },
            data: dataToUpdate,
          }),
        );
      }
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
      message: `Berhasil memperbarui ${updateOperations.length} kunci jawaban & pembahasan!`,
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
