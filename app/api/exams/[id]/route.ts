import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const exam = await prisma.exam.findUnique({
      where: { id },
      include: {
        questions: {
          orderBy: { questionNumber: "asc" },
        },
        _count: {
          select: { sessions: true },
        },
      },
    });

    if (!exam) {
      return NextResponse.json(
        { success: false, message: "Paket ujian tidak ditemukan" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: exam });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal mengambil detail ujian" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await prisma.exam.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Paket ujian berhasil dihapus",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal menghapus ujian" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await prisma.exam.update({
      where: { id },
      data: {
        title: body.title,
        description: body.description,
        category: body.category,
        durationMinutes: body.durationMinutes
          ? parseInt(body.durationMinutes, 10)
          : undefined,
        passingScore: body.passingScore
          ? parseInt(body.passingScore, 10)
          : undefined,
        isActive: body.isActive !== undefined ? body.isActive : undefined,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: "Gagal memperbarui ujian" },
      { status: 500 },
    );
  }
}
