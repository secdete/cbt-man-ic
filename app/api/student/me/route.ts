import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStudentFromRequest } from "@/lib/student-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const sessionPayload = await getStudentFromRequest(req);

    if (!sessionPayload) {
      return NextResponse.json({
        success: false,
        student: null,
      });
    }

    // Ambil data student terbaru dari database beserta riwayat sesi tryout
    const student = await prisma.student.findUnique({
      where: { id: sessionPayload.id },
      select: {
        id: true,
        name: true,
        nisn: true,
        school: true,
        createdAt: true,
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 10,
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
            tabSwitchCount: true,
            exam: {
              select: {
                id: true,
                title: true,
                category: true,
                token: true,
                durationMinutes: true,
                passingScore: true,
              },
            },
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({
        success: false,
        student: null,
      });
    }

    return NextResponse.json({
      success: true,
      student,
    });
  } catch (error: any) {
    console.error("Fetch current student error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Gagal memuat sesi siswa.",
      },
      { status: 500 },
    );
  }
}
