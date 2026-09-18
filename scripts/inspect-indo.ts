import fs from "fs";
import path from "path";

const text = fs.readFileSync(
  path.join(process.cwd(), "modul", "Modul-MAN-IC-extracted.txt"),
  "utf8",
);
const lines = text.split("\n");

console.log("Lines 130 - 195 (Bahasa Indonesia):");
for (let i = 130; i < 195; i++) {
  console.log(`L${i + 1}: ${lines[i]}`);
}
