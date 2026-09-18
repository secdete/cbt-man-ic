import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json({ success: false, message: 'Sesi tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        tabSwitchCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      success: true,
      tabSwitchCount: updated.tabSwitchCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

