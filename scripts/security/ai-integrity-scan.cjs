#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();
const includeExt = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const ignoreDirs = new Set(["node_modules", ".next", ".git", "dist", "build"]);

const backdoorPatterns = [
  { name: "eval", re: /\beval\s*\(/g },
  { name: "Function-constructor", re: /\bnew\s+Function\s*\(/g },
  { name: "child_process_exec", re: /child_process|\bexec\s*\(|\bspawn\s*\(/g },
  { name: "suspicious_remote", re: /https?:\/\/(?:pastebin|ngrok|webhook\.site|raw\.githubusercontent\.com)/gi },
];

const promptInjectionMarkers = [
  /ignore\s+previous\s+instructions/i,
  /system\s+override/i,
  /reveal\s+(?:secret|key|token)/i,
  /developer\s+message/i,
];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) {
      if (entry.name !== ".github") continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!ignoreDirs.has(entry.name)) walk(full, out);
      continue;
    }
    if (includeExt.has(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function resolveImport(fromFile, spec) {
  if (spec.startsWith("@/")) {
    return path.join(root, spec.slice(2));
  }
  if (spec.startsWith("./") || spec.startsWith("../")) {
    return path.resolve(path.dirname(fromFile), spec);
  }
  return null;
}

function existsModule(base) {
  const candidates = [
    base,
    `${base}.ts`, `${base}.tsx`, `${base}.js`, `${base}.jsx`, `${base}.mjs`, `${base}.cjs`,
    path.join(base, "index.ts"), path.join(base, "index.tsx"),
    path.join(base, "index.js"), path.join(base, "index.jsx"),
    path.join(base, "index.mjs"), path.join(base, "index.cjs"),
  ];
  return candidates.some((p) => fs.existsSync(p));
}

function relative(p) {
  return path.relative(root, p).replace(/\\/g, "/");
}

let findings = [];
const files = walk(root);

for (const file of files) {
  const relPath = relative(file);
  if (/^scripts\//.test(relPath)) continue;

  const content = fs.readFileSync(file, "utf8");

  for (const sig of backdoorPatterns) {
    if (sig.re.test(content)) {
      findings.push({ severity: "warn", type: "suspicious-pattern", file, detail: sig.name });
    }
  }

  const importRe = /(?:import\s+(?:[^"']+\s+from\s+)?|export\s+[^"']*\s+from\s+|require\s*\()\s*["']([^"']+)["']/g;
  for (const m of content.matchAll(importRe)) {
    const spec = m[1];
    const resolvedBase = resolveImport(file, spec);
    if (!resolvedBase) continue;
    if (!existsModule(resolvedBase)) {
      const isCriticalPath = /^(app|lib|components|hooks)\//.test(relPath);
      findings.push({ severity: isCriticalPath ? "error" : "warn", type: "broken-import", file, detail: spec });
    }
  }

  if (file.includes("/app/api/") && /(openai|anthropic|gemini|assistant|prompt|tami)/i.test(content)) {
    const hasValidation = /(zod|sanitize|length\s*[<>]=?|trim\(|max\()/i.test(content);
    if (!hasValidation) {
      findings.push({ severity: "error", type: "prompt-injection-risk", file, detail: "LLM endpoint icin input validation bulunamadi" });
    }

    for (const marker of promptInjectionMarkers) {
      if (marker.test(content) && !/block|deny|reject|sanitize/i.test(content)) {
        findings.push({ severity: "warn", type: "prompt-marker", file, detail: marker.toString() });
      }
    }
  }
}

const errors = findings.filter((f) => f.severity === "error");
const warns = findings.filter((f) => f.severity !== "error");

console.log(`[ai-integrity-scan] errors=${errors.length} warnings=${warns.length}`);
for (const f of findings.slice(0, 100)) {
  console.log(`- ${f.severity.toUpperCase()} ${f.type} ${relative(f.file)} :: ${f.detail}`);
}

if (errors.length > 0) {
  process.exit(1);
}
