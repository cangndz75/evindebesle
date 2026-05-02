#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json"]);
const ignoreDirs = new Set(["node_modules", ".next", ".git", "dist", "build"]);

const rules = [
  { type: "hardcoded-secret", severity: "error", re: /(AKIA[0-9A-Z]{16}|-----BEGIN (?:RSA|EC|DSA|OPENSSH) PRIVATE KEY-----|api[_-]?key\s*[:=]\s*["'][^"']{16,}["'])/g },
  { type: "sql-injection-risk", severity: "warn", re: /(\$queryRawUnsafe|\bquery\s*\(\s*["'`].*\$\{)/g },
  { type: "xss-danger", severity: "warn", re: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:/g },
  { type: "cors-wildcard", severity: "warn", re: /Access-Control-Allow-Origin\s*["']?\s*:\s*["']\*["']/g },
];

const privacyPatterns = [
  { tag: "location-data", re: /\b(latitude|longitude|geo(location)?|gps)\b/i },
  { tag: "device-id", re: /\b(deviceId|advertisingId|idfa|gaid)\b/i },
  { tag: "child-data", re: /\b(child|kids|minor|underage)\b/i },
];

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoreDirs.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (includeExt.has(path.extname(e.name))) out.push(full);
  }
  return out;
}

function rel(p) {
  return path.relative(root, p).replace(/\\/g, "/");
}

const files = walk(root);
const findings = [];
const sdkReviewFile = path.join(root, "SECURITY-SDK-REVIEW.md");
const sdkReviewText = fs.existsSync(sdkReviewFile)
  ? fs.readFileSync(sdkReviewFile, "utf8").toLowerCase()
  : "";

for (const file of files) {
  const relativePath = rel(file);
  if (relativePath.startsWith("scripts/security/")) {
    continue;
  }

  const text = fs.readFileSync(file, "utf8");
  const isJsonLdScript = /type\s*=\s*["']application\/ld\+json["']/.test(text) && /JSON\.stringify\(/.test(text);
  const hasSanitizedInnerHtml = /sanitizeHtmlForRender\(/.test(text);
  const trustedThreeDsRender =
    /app\/\(public\)\/payment\/(3ds|three-d)\//.test(relativePath) &&
    /trusted-3ds-render/i.test(text);

  for (const rule of rules) {
    if (rule.type === "xss-danger" && (isJsonLdScript || hasSanitizedInnerHtml || trustedThreeDsRender)) {
      continue;
    }

    if (rule.re.test(text)) {
      findings.push({ severity: rule.severity, type: rule.type, file, detail: "desen eslesti" });
    }
  }

  if (/app\/api\//.test(rel(file)) || /lib\//.test(rel(file))) {
    for (const p of privacyPatterns) {
      if (p.re.test(text) && !/consent|kvkk|gdpr|coppa|purpose|retention/i.test(text)) {
        findings.push({ severity: "warn", type: "privacy-governance", file, detail: `${p.tag} kullanimi icin acik governance izi yok` });
      }
    }
  }
}

const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
const sdkCandidates = ["firebase", "mixpanel", "amplitude", "appsflyer", "branch", "onesignal", "segment", "@sentry/nextjs"];
for (const sdk of sdkCandidates) {
  if (deps[sdk]) {
    const sdkKey = sdk.toLowerCase();
    const hasReview = sdkReviewText.includes(sdkKey) && /consent|privacy|kvkk|gdpr/.test(sdkReviewText);
    if (!hasReview) {
      findings.push({ severity: "warn", type: "third-party-sdk", file: path.join(root, "package.json"), detail: `${sdk} privacy sozlesme/consent review gerektirir` });
    }
  }
}

const authConfigPath = path.join(root, "lib", "auth.config.ts");
if (fs.existsSync(authConfigPath)) {
  const authSrc = fs.readFileSync(authConfigPath, "utf8");
  if (/strategy\s*:\s*["']jwt["']/.test(authSrc) && !/maxAge|updateAge/.test(authSrc)) {
    findings.push({ severity: "warn", type: "zombie-session", file: authConfigPath, detail: "JWT session var fakat maxAge/updateAge tanimsiz" });
  }
}

const hasOtpRoutes = fs.existsSync(path.join(root, "app", "api", "send-otp", "route.ts")) && fs.existsSync(path.join(root, "app", "api", "verify-otp", "route.ts"));
if (!hasOtpRoutes) {
  findings.push({ severity: "warn", type: "mfa", file: path.join(root, "app", "api"), detail: "OTP tabanli MFA endpointleri tam degil" });
}

console.log(`[sast-privacy-auth-scan] findings=${findings.length}`);
for (const f of findings.slice(0, 200)) {
  console.log(`- ${f.severity.toUpperCase()} ${f.type} ${rel(f.file)} :: ${f.detail}`);
}

if (findings.some((f) => f.severity === "error")) {
  process.exit(1);
}
