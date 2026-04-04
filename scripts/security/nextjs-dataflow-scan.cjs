#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const apiRoot = path.join(root, "app", "api");
const appRoot = path.join(root, "app");
const middlewarePath = path.join(root, "middleware.ts");

const sensitiveKeyRe = /(password|secret|token|refreshToken|apiKey|authorization|cookie|privateKey|sessionToken)/i;

function walk(dir, extFilter, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, extFilter, out);
    else if (extFilter.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

function rel(p) {
  return path.relative(root, p).replace(/\\/g, "/");
}

const routeFiles = walk(apiRoot, new Set([".ts", ".tsx", ".js", ".jsx"]))
  .filter((f) => /route\.(ts|tsx|js|jsx)$/.test(f));

const findings = [];

let hasGlobalApiNoStore = false;
if (fs.existsSync(middlewarePath)) {
  const middlewareSrc = fs.readFileSync(middlewarePath, "utf8");
  hasGlobalApiNoStore = /startsWith\(["']\/api\/["']\)/.test(middlewareSrc)
    && /(Cache-Control[\s\S]*no-store|applyNoStoreHeaders)/.test(middlewareSrc);
}

for (const file of routeFiles) {
  const src = fs.readFileSync(file, "utf8");
  const route = rel(file);
  const isAdminRoute = /\/api\/(admin|admin-)/.test(route);
  const hasSessionGuard = /getServerSession\(|getToken\(|requireAdmin\(|Unauthorized|401|403/.test(src);
  const hasAdminGuard = /isAdmin|role\s*===\s*["']admin["']|requireAdmin\(/.test(src);

  if (isAdminRoute && (!hasSessionGuard || !hasAdminGuard)) {
    findings.push({ severity: "error", type: "server-auth", file, detail: "Admin route icin yetki kontrolu zayif" });
  }

  if (/export\s+async\s+function\s+GET/.test(src) && hasSessionGuard) {
    const hasNoStore = hasGlobalApiNoStore || /Cache-Control["']?\s*:\s*["'][^"']*no-store|cache\s*:\s*["']no-store["']|dynamic\s*=\s*["']force-dynamic["']|jsonNoStore\(|withNoStore\(/.test(src);
    if (!hasNoStore) {
      findings.push({ severity: "warn", type: "cache-poisoning", file, detail: "Auth iceren GET route no-store belirtmiyor" });
    }
  }

  const responseRe = /NextResponse\.json\s*\((\{[\s\S]*?\})\s*(?:,|\))/g;
  for (const m of src.matchAll(responseRe)) {
    if (sensitiveKeyRe.test(m[1])) {
      findings.push({ severity: "error", type: "payload-leak", file, detail: "JSON response icinde hassas key deseni" });
    }
  }
}

const appFiles = walk(appRoot, new Set([".ts", ".tsx", ".js", ".jsx"]));
const serverActionFiles = appFiles.filter((f) => /\.(ts|tsx|js|jsx)$/.test(f));

for (const file of serverActionFiles) {
  const src = fs.readFileSync(file, "utf8");
  if (!/["']use server["']/.test(src)) continue;
  const hasAuth = /getServerSession|getCurrentUser|getToken|auth\(/.test(src);
  if (!hasAuth) {
    findings.push({ severity: "error", type: "server-action-auth", file, detail: "use server dosyasinda auth guard bulunamadi" });
  }
}

console.log(`[nextjs-dataflow-scan] findings=${findings.length}`);
for (const f of findings.slice(0, 150)) {
  console.log(`- ${f.severity.toUpperCase()} ${f.type} ${rel(f.file)} :: ${f.detail}`);
}

if (findings.some((f) => f.severity === "error")) {
  process.exit(1);
}
