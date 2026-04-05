const fs = require("fs");
const path = require("path");

const roots = ["app", "components", "hooks", "iyzico-server", "lib", "prisma", "scripts", "README.md"];
const extensions = new Set([".ts", ".tsx", ".js", ".jsx", ".cjs", ".mjs", ".json", ".md", ".prisma", ".css", ".txt"]);
const skipDirs = new Set(["node_modules", ".git", ".next", ".vercel", ".turbo", "dist", "build"]);

const replacements = [
  ["\u00C4\u00B0", "İ"],
  ["\u00C4\u00B1", "ı"],
  ["\u00C4\u009E", "Ğ"],
  ["\u00C4\u009F", "ğ"],
  ["\u00C3\u00A7", "ç"],
  ["\u00C3\u0087", "Ç"],
  ["\u00C3\u2021", "Ç"],
  ["\u00C3\u00B6", "ö"],
  ["\u00C3\u0096", "Ö"],
  ["\u00C3\u2013", "Ö"],
  ["\u00C3\u00BC", "ü"],
  ["\u00C3\u009C", "Ü"],
  ["\u00C3\u0153", "Ü"],
  ["\u00C3\u015C", "Ü"],
  ["\u00C4\u0178", "ğ"],
  ["\u00C4\u017D", "Ğ"],
  ["\u00C5\u009E", "Ş"],
  ["\u00C5\u009F", "ş"],
  ["\u00C5\u0178", "ş"],
  ["\u00C5\u017D", "Ş"],
  ["\u00C2\u00A9", "©"],
  ["\u00C2\u00AE", "®"],
  ["\u00C2\u00B0", "°"],
  ["\u00C2\u00BA", "º"],
  ["\u00C2\u00B7", "·"],
  ["\u00E2\u20AC\u2122", "’"],
  ["\u00E2\u20AC\u02DC", "‘"],
  ["\u00E2\u20AC\u0153", "“"],
  ["\u00E2\u20AC\u009D", "”"],
  ["\u00E2\u20AC\u201C", "–"],
  ["\u00E2\u20AC\u201D", "—"],
  ["\u00E2\u20AC\u00A6", "…"],
  ["\u00E2\u20AC\u00A2", "•"],
  ["\u00E2\u2020\u2019", "→"],
  ["\u00E2\u0153\u201C", "✓"],
  ["\u00E2\u0153\u2022", "✕"],
  ["\u00E2\u0153\u2026", "✅"],
  ["\u00E2\u0161\u00A0\u00EF\u00B8\u008F", "⚠️"],
  ["\u00E2\u0152\u02DCE", "⌘E"],
  ["\u00E2\u0152\u02DCD", "⌘D"],
  ["\u00E2\u0152\u02DCA", "⌘A"],
  ["\u00E2\u0152\u02DC\u00E2\u0152\u00AB", "⌘⌫"],
  ["\u00E2\u201A\u00BA", "₺"],
  ["\u00EF\u00BB\u00BF", ""],
  ["\uFFFD", ""],
];

const mojibakePattern = /[\u00C2\u00C3\u00C4\u00C5\u00E2](?:.|$)|\uFFFD/;

function listFiles(entry) {
  const stat = fs.statSync(entry);
  if (stat.isFile()) {
    return extensions.has(path.extname(entry)) ? [entry] : [];
  }

  const output = [];
  for (const child of fs.readdirSync(entry)) {
    if (skipDirs.has(child)) continue;
    output.push(...listFiles(path.join(entry, child)));
  }
  return output;
}

function decodeEscaped(value) {
  return JSON.parse(`"${value}"`);
}

function repairText(text) {
  let next = text;
  for (const [from, to] of replacements) {
    next = next.split(decodeEscaped(from)).join(to);
  }
  return next;
}

function countMatches(text) {
  return (text.match(/[ÃÄÅÂâ]/g) || []).length;
}

function main() {
  const mode = process.argv[2] || "check";
  const files = roots.flatMap((root) => listFiles(path.resolve(process.cwd(), root)).filter(Boolean));
  const touched = [];

  for (const file of files) {
    const original = fs.readFileSync(file, "utf8");
    if (!mojibakePattern.test(original)) continue;

    const repaired = repairText(original);
    if (repaired === original) continue;

    const before = countMatches(original);
    const after = countMatches(repaired);
    if (after > before) continue;

    touched.push({ file, before, after });
    if (mode === "write") {
      fs.writeFileSync(file, repaired, "utf8");
    }
  }

  for (const item of touched) {
    console.log(`${mode === "write" ? "fixed" : "would-fix"}: ${path.relative(process.cwd(), item.file)} (${item.before} -> ${item.after})`);
  }

  console.log(`${mode}: ${touched.length} file(s)`);
}

main();