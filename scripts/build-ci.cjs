const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const NEXT_DIR = path.resolve(process.cwd(), ".next");
const NEXT_CI_DIR = path.resolve(process.cwd(), ".next-ci");
const NEXT_CI_RETRY_DIR = path.resolve(process.cwd(), ".next-ci-retry");

function ensureDistDirPackageType(distDir) {
  if (!distDir) return;

  const absoluteDir = path.resolve(process.cwd(), distDir);
  fs.mkdirSync(absoluteDir, { recursive: true });
  fs.writeFileSync(
    path.join(absoluteDir, "package.json"),
    JSON.stringify({ type: "commonjs" }),
    "utf8"
  );
}

function runBuild(distDir) {
  ensureDistDirPackageType(distDir);

  const env = {
    ...process.env,
  };

  if (distDir) {
    env.NEXT_DIST_DIR = distDir;
  } else {
    delete env.NEXT_DIST_DIR;
  }

  return spawnSync("npx next build --no-lint", {
    encoding: "utf8",
    shell: true,
    env,
  });
}

function printResult(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

function isTransientBuildFsError(output) {
  return (
    (output.includes(".next") || output.includes("trace")) &&
    (output.includes("ENOENT") || output.includes("EPERM") || output.includes("page.js.nft.json"))
  );
}

function isPagesManifestMissing(output) {
  return output.includes("pages-manifest.json") && output.includes("ENOENT");
}

function cleanBuildDirs() {
  try {
    fs.rmSync(NEXT_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors; retry will still attempt build.
  }

  try {
    fs.rmSync(NEXT_CI_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors; retry will still attempt build.
  }

  try {
    fs.rmSync(NEXT_CI_RETRY_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors; retry will still attempt build.
  }
}

cleanBuildDirs();

let result = runBuild(".next-ci");

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

printResult(result);

if (result.status === 0) {
  process.exit(0);
}

const combinedOutput = `${result.stdout || ""}\n${result.stderr || ""}`;

if (isPagesManifestMissing(combinedOutput)) {
  console.warn("[build:ci] Isolated distDir produced pages-manifest ENOENT. Falling back to default .next build...");
  cleanBuildDirs();
  result = runBuild(undefined);

  if (result.error) {
    console.error(result.error);
    process.exit(1);
  }

  printResult(result);
  process.exit(result.status || 1);
}

if (!isTransientBuildFsError(combinedOutput)) {
  process.exit(result.status || 1);
}

console.warn("[build:ci] Transient .next filesystem error detected. Cleaning cache and retrying once...");
cleanBuildDirs();

result = runBuild(".next-ci-retry");

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

printResult(result);
process.exit(result.status || 1);
