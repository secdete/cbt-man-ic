import fs from "fs";
import path from "path";

const text = fs.readFileSync(
  path.join(process.cwd(), "modul", "Modul-MAN-IC-extracted.txt"),
  "utf8",
);
const lines = text.split("\n");

// Cari baris 1280 sampai 1350
console.log("Lines 1290 - 1345:");
for (let i = 1290; i < 1345; i++) {
  console.log(`L${i + 1}: ${lines[i]}`);
}
