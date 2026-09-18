const fs = require("fs");
const path = require("path");

const target = process.argv[2] || "sqlite";
const schemaPath = path.join(__dirname, "..", "prisma", "schema.prisma");
const pgSchemaPath = path.join(
  __dirname,
  "..",
  "prisma",
  "schema.postgresql.prisma",
);

if (target === "supabase" || target === "postgresql") {
  if (fs.existsSync(pgSchemaPath)) {
    fs.copyFileSync(pgSchemaPath, schemaPath);
    console.log("✅ Skema Prisma berhasil dialihkan ke PostgreSQL (Supabase).");
    console.log("Pastikan DATABASE_URL diatur ke koneksi Supabase Anda.");
  } else {
    console.error("File schema.postgresql.prisma tidak ditemukan.");
  }
} else {
  // SQLite
  const sqliteContent = fs
    .readFileSync(pgSchemaPath, "utf8")
    .replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"')
    .replace(/directUrl\s*=\s*env\("DIRECT_URL"\)\n?/g, "");
  fs.writeFileSync(schemaPath, sqliteContent, "utf8");
  console.log("✅ Skema Prisma berhasil dialihkan ke SQLite (Local Dev).");
}
