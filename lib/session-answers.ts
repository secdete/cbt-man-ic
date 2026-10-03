import prisma from "@/lib/prisma";

export interface AnswerEntry {
  questionId: string;
  selectedOption: string | null;
  isDoubtful: boolean;
}

const normalizeOption = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toUpperCase();
  return trimmed ? trimmed : null;
};

/**
 * Terima jawaban dari klien dalam dua bentuk (array atau record) dan
 * buang yang formatnya salah supaya satu entri rusak tidak menggugurkan
 * seluruh kiriman.
 */
export function normalizeAnswers(raw: unknown): AnswerEntry[] {
  if (!raw) return [];
  const entries: AnswerEntry[] = [];

  if (Array.isArray(raw)) {
    const list = raw as Array<{
      questionId?: string;
      selectedOption?: string | null;
      isDoubtful?: boolean;
    }>;
    for (const item of list) {
      if (!item || typeof item.questionId !== "string" || !item.questionId.trim()) continue;
      entries.push({
        questionId: item.questionId.trim(),
        selectedOption: normalizeOption(item.selectedOption),
        isDoubtful: Boolean(item.isDoubtful),
      });
    }
    return entries;
  }

  if (typeof raw === "object") {
    for (const [questionId, value] of Object.entries(raw as Record<string, unknown>)) {
      if (!questionId.trim()) continue;
      const item = (value ?? {}) as { selectedOption?: string | null; isDoubtful?: boolean };
      entries.push({
        questionId: questionId.trim(),
        selectedOption: normalizeOption(item.selectedOption),
        isDoubtful: Boolean(item.isDoubtful),
      });
    }
  }

  return entries;
}

/** Kumpulkan id soal yang benar-benar termasuk dalam paket ujian ini. */
export async function questionIdsInPackage(examId: string): Promise<Set<string>> {
  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    select: { id: true, questions: { select: { id: true } }, subtests: { select: { questions: { select: { id: true } } } } },
  });
  const ids = new Set<string>();
  if (!exam) return ids;
  exam.questions.forEach((q) => ids.add(q.id));
  exam.subtests.forEach((subtest) => subtest.questions.forEach((q) => ids.add(q.id)));
  return ids;
}

/**
 * Simpan jawaban (create bila belum ada, timpa kalau sudah).
 * Entri yang id soalnya tidak ada di paket akan dilewati, bukan gagalkan batch.
 */
export async function upsertAnswers(
  sessionId: string,
  entries: AnswerEntry[],
  allowedIds: Set<string>,
): Promise<number> {
  const usable = entries.filter((entry) => allowedIds.has(entry.questionId));
  if (!usable.length) return 0;

  const operations = usable.map((entry) =>
    prisma.answerSubmission.upsert({
      where: {
        sessionId_questionId: { sessionId, questionId: entry.questionId },
      },
      create: {
        sessionId,
        questionId: entry.questionId,
        selectedOption: entry.selectedOption,
        isDoubtful: entry.isDoubtful,
        answeredAt: new Date(),
      },
      update: {
        selectedOption: entry.selectedOption,
        isDoubtful: entry.isDoubtful,
        answeredAt: new Date(),
      },
    }),
  );

  await prisma.$transaction(operations);
  return usable.length;
}
