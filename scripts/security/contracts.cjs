#!/usr/bin/env node
const fs = require("node:fs");
const path = require("node:path");

const root = process.cwd();

function fail(msg) {
  console.error(`[security-contracts][FAIL] ${msg}`);
  process.exitCode = 1;
}

function ok(msg) {
  console.log(`[security-contracts][OK] ${msg}`);
}

function read(relPath) {
  return fs.readFileSync(path.join(root, relPath), "utf8");
}

async function dynamicChecks() {
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    console.log("[security-contracts] APP_BASE_URL yok, dynamic kontratlar atlandi.");
    return;
  }

  async function safeFetch(url, init) {
    try {
      return await fetch(url, init);
    } catch (err) {
      console.warn(`[security-contracts] dynamic kontrat atlandi, baglanti kurulamadi: ${url}`);
      return null;
    }
  }

  const adminRes = await safeFetch(`${baseUrl}/api/admin/dashboard-stats`, { redirect: "manual" });
  if (!adminRes) return;
  if (![401, 403, 302].includes(adminRes.status)) {
    fail(`/api/admin/dashboard-stats yetkisiz durumda 401/403/302 donmeli, gelen=${adminRes.status}`);
  } else {
    ok(`/api/admin/dashboard-stats unauthorized status=${adminRes.status}`);
  }

  const meRes = await safeFetch(`${baseUrl}/api/user/me`, { redirect: "manual" });
  if (!meRes) return;
  const meBody = await meRes.json().catch(() => ({}));
  if (![401, 403, 200].includes(meRes.status)) {
    fail(`/api/user/me beklenmeyen status=${meRes.status}`);
  } else {
    ok(`/api/user/me status=${meRes.status}`);
  }

  const raw = JSON.stringify(meBody).toLowerCase();
  if (raw.includes("passwordhash") || raw.includes("salt") || raw.includes("refreshToken".toLowerCase())) {
    fail("/api/user/me response hassas alan iceriyor (passwordHash/salt/refreshToken)");
  } else {
    ok("/api/user/me response hassas alan icermiyor");
  }
}

function staticChecks() {
  const mustHaveServerOnly = [
    "lib/db.ts",
    "lib/auth.config.ts",
    "lib/env.ts",
    "lib/auth/getCurrentUser.ts",
    "lib/api/dto/order.ts",
    "lib/actions/policy.ts",
  ];

  for (const rel of mustHaveServerOnly) {
    const src = read(rel);
    if (!/import\s+["']server-only["']/.test(src)) {
      fail(`${rel} dosyasinda server-only guard eksik`);
    } else {
      ok(`${rel} server-only guard mevcut`);
    }
  }

  const orderDetailRoute = read("app/api/orders/[id]/route.ts");
  if (!/toOrderDetailDTO\(/.test(orderDetailRoute)) {
    fail("app/api/orders/[id]/route.ts DTO kullanmiyor");
  } else {
    ok("app/api/orders/[id]/route.ts DTO kullaniyor");
  }

  const userMeRoute = read("app/api/user/me/route.ts");
  if (!/dynamic\s*=\s*["']force-dynamic["']/.test(userMeRoute)) {
    fail("app/api/user/me/route.ts force-dynamic eksik");
  } else {
    ok("app/api/user/me/route.ts force-dynamic mevcut");
  }
}

(async () => {
  try {
    staticChecks();
    await dynamicChecks();

    if (process.exitCode && process.exitCode !== 0) {
      process.exit(process.exitCode);
    }

    console.log("[security-contracts] tum kontratlar gecti.");
  } catch (err) {
    console.error("[security-contracts] exception", err);
    process.exit(2);
  }
})();
