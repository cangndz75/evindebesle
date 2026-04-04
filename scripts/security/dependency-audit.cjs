#!/usr/bin/env node
const { spawnSync } = require("node:child_process");

function runAudit(args) {
  return spawnSync("npm", ["audit", "--json", ...args], {
    encoding: "utf8",
    shell: process.platform === "win32",
  });
}

function parseAudit(raw) {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

const prodResult = runAudit(["--omit=dev"]);
const fullResult = runAudit([]);
const raw = prodResult.stdout || fullResult.stdout || "";
const report = parseAudit(raw);

if (!report) {
  console.error("[dependency-audit] npm audit JSON parse edilemedi.");
  console.error(prodResult.stderr || fullResult.stderr || "Bilinmeyen hata");
  process.exit(2);
}

const metadata = report.metadata || {};
const vulns = metadata.vulnerabilities || {};
const critical = Number(vulns.critical || 0);
const high = Number(vulns.high || 0);
const moderate = Number(vulns.moderate || 0);
const low = Number(vulns.low || 0);

console.log("[dependency-audit] Sonuc");
console.log(`critical=${critical} high=${high} moderate=${moderate} low=${low}`);

if (critical > 0 || high > 0) {
  console.error("[dependency-audit] High/Critical acik bulundu. CI fail.");
  process.exit(1);
}

console.log("[dependency-audit] High/Critical acik yok.");
