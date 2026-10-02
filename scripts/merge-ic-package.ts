import prisma from "../lib/prisma";

// Urutan seksi di dalam paket try out utuh
const SECTIONS = [
  "IC-INDO",
  "IC-ARAB",
  "IC-INGG",
  "IC-MTK",
  "IC-IPA",
  "IC-IPS",
  "IC-AGAMA",
  "IC-ANALITIK",
];

const PACKAGE = {
  token: "IC-PAKET-UTUH",
  title: "Paket Try Out Utuh SNPDB MAN Insan Cendekia",
  description:
    "Satu paket tryout utuh berisi 8 seksi: Bahasa Indonesia, Bahasa Arab, Bahasa Inggris, Matematika, IPA, IPS, Literasi Keagamaan Islam, dan Kemampuan Analitik. Satu token untuk seluruh seksi.",
  category: "SNPDB 2023",
  durationMinutes: 150,
  passingScore: 70,
};

async function main() {
  const subtests = await prisma.exam.findMany({
    where: { token: { in: SECTIONS } },
    select: { id: true, token: true, title: true, parentExamId: true, _count: { select: { questions: true } } },
  });

  if (subtests.length !== SECTIONS.length) {
    const missing = SECTIONS.filter((token) => !subtests.some((exam) => exam.token === token));
    throw new Error(`Subtest tidak ditemukan: ${missing.join(", ")}`);
  }

  const taken = subtests.filter((exam) => exam.parentExamId);
  if (taken.length) {
    throw new Error(
      `Subtest sudah tergabung ke paket lain: ${taken.map((exam) => exam.title).join(", ")}`,
    );
  }

  const existing = await prisma.exam.findUnique({ where: { token: PACKAGE.token } });
  if (existing) {
    throw new Error(`Token paket ${PACKAGE.token} sudah dipakai. Batal, tidak ada perubahan.`);
  }

  const ordered = SECTIONS.map((token) => subtests.find((exam) => exam.token === token)!);
  const totalQuestions = ordered.reduce((sum, exam) => sum + exam._count.questions, 0);

  const created = await prisma.$transaction(async (tx) => {
    const pack = await tx.exam.create({ data: { ...PACKAGE, isActive: true } });

    for (const [index, subtest] of ordered.entries()) {
      await tx.exam.update({
        where: { id: subtest.id },
        data: { parentExamId: pack.id, isActive: false, isLocked: true, sortOrder: index },
      });
    }

    return pack;
  });

  console.log(`Paket dibuat: ${created.title} (${created.token}) -> ${created.id}`);
  console.log(`Total soal: ${totalQuestions} dari ${ordered.length} seksi`);
  for (const [index, subtest] of ordered.entries()) {
    console.log(`  ${index + 1}. ${subtest.title} (${subtest._count.questions} soal)`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error("GAGAL:", error.message || error);
    await prisma.$disconnect();
    process.exit(1);
  });
