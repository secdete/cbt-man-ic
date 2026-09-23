import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await prisma.examSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true, tabSwitchCount: true },
    });

    if (!session) {
      return NextResponse.json({ success: false, message: 'Sesi tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: session });
  } catch (error: any) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

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

    if (session.status !== 'IN_PROGRESS') {
      return NextResponse.json({
        success: false,
        message: 'Sesi ujian sudah berakhir.',
        status: session.status,
        tabSwitchCount: session.tabSwitchCount,
      }, { status: 409 });
    }

    const updated = await prisma.examSession.update({
      where: { id: sessionId },
      data: {
        tabSwitchCount: {
          increment: 1,
        },
      },
    });

    if (updated.tabSwitchCount >= 3) {
      await prisma.examSession.update({
        where: { id: sessionId },
        data: {
          status: 'COMPLETED',
          endTime: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      tabSwitchCount: updated.tabSwitchCount,
      status: updated.tabSwitchCount >= 3 ? 'COMPLETED' : updated.status,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}

