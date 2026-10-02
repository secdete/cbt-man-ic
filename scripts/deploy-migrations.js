async function deployMigrations() {
  if (process.env.VERCEL !== "1" && !process.env.VERCEL_ENV) return;

  const { spawnSync } = await import("node:child_process");
  const separator = process.platform === "win32" ? "\\" : "/";
  const prismaCli = `${process.cwd()}${separator}node_modules${separator}prisma${separator}build${separator}index.js`;
  const result = spawnSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    stdio: "inherit",
    env: process.env,
  });

  if (result.error) {
    console.error("Gagal menjalankan migrasi database:", result.error.message);
    process.exitCode = 1;
    return;
  }
  process.exitCode = result.status ?? 1;
}

deployMigrations();
