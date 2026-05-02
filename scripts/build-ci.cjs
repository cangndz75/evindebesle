const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const NEXT_DIR = path.resolve(process.cwd(), ".next");

function runBuild() {
  return spawnSync("npx next build --no-lint", {
    encoding: "utf8",
    shell: true,
  });
}

function printResult(result) {
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

function isTransientBuildFsError(output) {
  return (
    output.includes(".next") &&
    (output.includes("ENOENT") || output.includes("EPERM") || output.includes("page.js.nft.json"))
  );
}

function cleanNextDir() {
  try {
    fs.rmSync(NEXT_DIR, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors; retry will still attempt build.
  }
}

let result = runBuild();

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

printResult(result);

if (result.status === 0) {
  process.exit(0);
}

const combinedOutput = `${result.stdout || ""}\n${result.stderr || ""}`;
if (!isTransientBuildFsError(combinedOutput)) {
  process.exit(result.status || 1);
}

console.warn("[build:ci] Transient .next filesystem error detected. Cleaning cache and retrying once...");
cleanNextDir();

result = runBuild();

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

printResult(result);
process.exit(result.status || 1);
