import type { NextConfig } from "next";
import fs from "fs";
import path from "path";

// Auto fallback: jika .env lokal belum ada (misal setelah git pull oleh rekan kerja), otomatis buat dari .env.example
const envPath = path.join(process.cwd(), ".env");
const examplePath = path.join(process.cwd(), ".env.example");
if (!fs.existsSync(envPath) && fs.existsSync(examplePath)) {
  try {
    fs.copyFileSync(examplePath, envPath);
    console.log(
      "ℹ️ .env lokal otomatis dibuat dari .env.example (koneksi Supabase PostgreSQL)",
    );
  } catch (e) {
    // Ignore error if file is read-only
  }
}

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
