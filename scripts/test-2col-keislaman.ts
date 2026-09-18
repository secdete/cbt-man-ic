import fs from "fs";
import path from "path";

const text = fs.readFileSync(
  path.join(process.cwd(), "modul", "Modul-MAN-IC-extracted.txt"),
  "utf8",
);
const lines = text.split("\n");

// Ambil baris 1323 sampai 1497 (MATA UJI : Keislaman)
const keislamanLines = lines.slice(1322, 1496);

console.log("=== PARSING KEISLAMAN WITH 2-COLUMN AWARENESS ===");

// Kumpulkan semua blok opsi: (A) ... (B) ... (C) ... (D) ...
const optGroupRegex =
  /\(A\)\s*([\s\S]+?)\s*\(B\)\s*([\s\S]+?)\s*\(C\)\s*([\s\S]+?)\s*\(D\)\s*([\s\S]+?)(?=(?:\(A\)|\d{1,2}\.|$))/gi;

const keislamanText = keislamanLines
  .join("\n")
  .replace(/--\s*\d+\s*of\s*271\s*--/gi, "");

// Ekstrak semua opsi A, B, C, D
const allOptionSets: { a: string; b: string; c: string; d: string }[] = [];
let om;
const optItemRegex =
  /(?:^|\n)\s*\(A\)\s*([^\r\n]+(?:\n(?!\([A-D]\)|\d+\.)[^\r\n]+)*)\s*\(B\)\s*([^\r\n]+(?:\n(?!\([A-D]\)|\d+\.)[^\r\n]+)*)\s*\(C\)\s*([^\r\n]+(?:\n(?!\([A-D]\)|\d+\.)[^\r\n]+)*)\s*\(D\)\s*([^\r\n]+(?:\n(?!\([A-D]\)|\d+\.)[^\r\n]+)*)/g;

while ((om = optItemRegex.exec(keislamanText)) !== null) {
  allOptionSets.push({
    a: om[1].replace(/\s+/g, " ").trim(),
    b: om[2].replace(/\s+/g, " ").trim(),
    c: om[3].replace(/\s+/g, " ").trim(),
    d: om[4].replace(/\s+/g, " ").trim(),
  });
}

console.log(
  `Ditemukan ${allOptionSets.length} set opsi (A-D) lengkap di Keislaman.`,
);
allOptionSets.slice(0, 5).forEach((os, i) => {
  console.log(`Set #${i + 1}:`);
  console.log(`  A: ${os.a.slice(0, 40)}`);
  console.log(`  B: ${os.b.slice(0, 40)}`);
  console.log(`  C: ${os.c.slice(0, 40)}`);
  console.log(`  D: ${os.d.slice(0, 40)}`);
});

// Ekstrak semua nomor dan teks pertanyaan: 1. ... 2. ...
const qItemRegex =
  /(?:^|\n)\s*(\d{1,2})\.\s*([^\r\n]+(?:\n(?!\d+\.|\(A\))[^\r\n]+)*)/g;
const allQuestionsFound: { num: number; text: string }[] = [];
let qm;
while ((qm = qItemRegex.exec(keislamanText)) !== null) {
  allQuestionsFound.push({
    num: parseInt(qm[1], 10),
    text: qm[2].replace(/\s+/g, " ").trim(),
  });
}

console.log(`\nDitemukan ${allQuestionsFound.length} pertanyaan di Keislaman.`);
allQuestionsFound.slice(0, 5).forEach((q) => {
  console.log(`Soal #${q.num}: ${q.text.slice(0, 60)}...`);
});
