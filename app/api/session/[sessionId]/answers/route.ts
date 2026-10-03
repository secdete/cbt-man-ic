import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { normalizeAnswers, questionIdsInPackage, upsertAnswers } from "@/lib/session-answers";

export const dynamic = "force-dynamic";

async function loadSession(sessionId: string) {
  return prisma.examSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      status: true,
      exam: {
        select: {
          id: true,
          isLocked: true,
          closeTime: true,
        },
      },
    },
  });
}

/** Ambil seluruh jawaban tersimpan untuk sesi ini (dipakai saat halaman dibuka ulang). */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      select: { id: true, submissions: { select: { questionId: true, selectedOption: true, isDoubtful: true } } },
    });

    if (!session) {
      return NextResponse.json({ success: false, message: "Sesi ujian tidak ditemukan." }, { status: 404 });
    }

    const data: Record<string, { selectedOption: string | null; isDoubtful: boolean }> = {};
    session.submissions.forEach((sub) => {
      data[sub.questionId] = { selectedOption: sub.selectedOption, isDoubtful: sub.isDoubtful };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Load answers failed:", error);
    return NextResponse.json({ success: false, message: "Gagal memuat jawaban." }, { status: 500 });
  }
}

/**
 * Simpan banyak jawaban sekaligus (sinkronisasi antrean lokal & kiriman akhir).
 * Sasaran penyimpanan utama saat autosave per soal sempat gagal.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const body = await req.json().catch(() => ({}));

    const session = await loadSession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, message: "Sesi ujian tidak ditemukan." }, { status: 404 });
    }

    if (session.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { success: false, message: "Sesi ujian ini telah selesai dan tidak dapat diubah lagi." },
        { status: 400 },
      );
    }

    // Penguncian manual oleh panitia tetap memblokir; status nonaktif tidak,
    // karena toggle itu pernah diam-diam membuang jawaban peserta yang sedang berjalan.
    if (session.exam.isLocked) {
      return NextResponse.json(
        { success: false, message: "Ujian telah dikunci oleh panitia. Jawaban tidak dapat diubah." },
        { status: 403 },
      );
    }

    const entries = normalizeAnswers(body?.answers ?? body);
    if (!entries.length) {
      return NextResponse.json({ success: true, data: { saved: 0 } });
    }

    const allowedIds = await questionIdsInPackage(session.exam.id);
    const saved = await upsertAnswers(sessionId, entries, allowedIds);

    return NextResponse.json({ success: true, data: { saved } });
  } catch (error) {
    console.error("Bulk save answers failed:", error);
    return NextResponse.json({ success: false, message: "Gagal menyimpan jawaban." }, { status: 500 });
  }
}
