import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function check() {
  console.log("=== COMPREHENSIVE LIVE DATABASE AUDIT ===");
  const exams = await prisma.exam.findMany({
    include: {
      questions: {
        orderBy: { questionNumber: "asc" },
      },
    },
    orderBy: { token: "asc" },
  });

  for (const ex of exams) {
    const qs = ex.questions;
    const withStim = qs.filter((q) => q.questionText.includes("!["));
    const withOptImg = qs.filter((q) =>
      [q.optionA, q.optionB, q.optionC, q.optionD, q.optionE].some(
        (o) => o && o.includes("!["),
      ),
    );
    const dummies = qs.filter(
      (q) => q.optionA === "Pilihan A" || q.optionA === null,
    );

    console.log(`\n[${ex.token}] ${ex.title}`);
    console.log(
      `  Total: ${qs.length} Qs | Stimulus Imgs: ${withStim.length} | Option Imgs: ${withOptImg.length} | Dummies: ${dummies.length}`,
    );

    // Sample check first 3 questions with stimulus
    for (const q of withStim.slice(0, 3)) {
      const imgMatch = q.questionText.match(/!\[.*?\]\((.*?)\)/);
      const imgSrc = imgMatch ? imgMatch[1].split("/").pop() : "";
      const textSnippet = q.questionText
        .replace(/!\[.*?\]\(.*?\)/g, "")
        .trim()
        .split("\n")[0]
        .slice(0, 60);
      console.log(`    - Q${q.questionNumber}: [${imgSrc}] -> ${textSnippet}`);
    }
  }
}

check()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
