const fs = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const prismaBin = path.resolve(__dirname, "..", "node_modules", ".bin", process.platform === "win32" ? "prisma.cmd" : "prisma");
const migrationsDir = path.resolve(__dirname, "..", "prisma", "migrations");

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

function getMigrationNames() {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }

  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

function baselineExistingDatabase() {
  const [baselineMigration] = getMigrationNames();

  if (!baselineMigration) {
    console.error("Prisma found an existing non-empty database, but this repo has no migration directories to baseline.");
    return { status: 1 };
  }

  console.warn(
    `Existing non-empty database detected without Prisma migration history. Marking \`${baselineMigration}\` as already applied, then re-running \`prisma migrate deploy\`.`
  );

  const resolveResult = runPrisma(["migrate", "resolve", "--applied", baselineMigration]);
  writeOutput(resolveResult);

  if (resolveResult.status !== 0) {
    return resolveResult;
  }

  const redeployResult = runPrisma(["migrate", "deploy"]);
  writeOutput(redeployResult);
  return redeployResult;
}

const migrateResult = runPrisma(["migrate", "deploy"]);
writeOutput(migrateResult);

if (migrateResult.status === 0) {
  process.exit(0);
}

const stdout = migrateResult.stdout ? String(migrateResult.stdout) : "";
const stderr = migrateResult.stderr ? String(migrateResult.stderr) : "";
const combined = `${stdout}\n${stderr}`;

if (combined.includes("P3005")) {
  const baselineResult = baselineExistingDatabase();
  process.exit(baselineResult.status ?? 1);
}

if (combined.includes("No migration found in prisma/migrations")) {
  console.error("No Prisma migrations were found in `prisma/migrations`. Commit the migration files before deploying.");
}

process.exit(migrateResult.status ?? 1);
