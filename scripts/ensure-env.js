const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env");
const examplePath = path.join(__dirname, "..", ".env.example");

if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  try {
    fs.copyFileSync(examplePath, envPath);
    console.log("ℹ️ .env berhasil dibuat otomatis dari .env.example");
  } catch (err) {
    console.error("Gagal menyalin .env.example:", err.message);
  }
}
