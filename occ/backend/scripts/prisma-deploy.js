const { spawnSync } = require("node:child_process");
const path = require("node:path");

const prismaBin = path.resolve(__dirname, "..", "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");

function runPrisma(args) {
  return spawnSync(prismaBin, args, {
    cwd: path.resolve(__dirname, ".."),
    stdio: "pipe",
    shell: process.platform === "win32"
  });
}

function writeOutput(result) {
  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }
}

const migrateResult = runPrisma(["migrate", "deploy"]);
writeOutput(migrateResult);

if (migrateResult.status === 0) {
  process.exit(0);
}

const stdout = migrateResult.stdout ? String(migrateResult.stdout) : "";
const stderr = migrateResult.stderr ? String(migrateResult.stderr) : "";
const combined = `${stdout}\n${stderr}`;

const shouldFallback =
  combined.includes("P3005") ||
  combined.includes("No migration found in prisma/migrations");

if (!shouldFallback) {
  process.exit(migrateResult.status ?? 1);
}

console.warn("No Prisma migration history was found for the existing database. Falling back to `prisma db push --skip-generate` for deployment.");

const pushResult = runPrisma(["db", "push", "--skip-generate"]);
writeOutput(pushResult);
process.exit(pushResult.status ?? 1);
