#!/usr/bin/env node
const endpoints = [
  { path: "/api/admin/dashboard-stats", expect: [401, 403, 302] },
  { path: "/api/user/me", expect: [401, 403] },
  { path: "/api/orders", expect: [401, 403] },
];

const baseUrl = process.env.APP_BASE_URL || "http://localhost:3000";

async function request(path, init = {}) {
  const url = `${baseUrl}${path}`;
  const res = await fetch(url, init);
  return res;
}

async function main() {
  let failures = 0;
  console.log(`[dast-smoke] baseUrl=${baseUrl}`);

  for (const e of endpoints) {
    try {
      const res = await request(e.path, {
        method: "GET",
        redirect: "manual",
        headers: { Origin: "https://evil.example" },
      });
      const ok = e.expect.includes(res.status);
      const acao = res.headers.get("access-control-allow-origin");
      const acac = res.headers.get("access-control-allow-credentials");

      console.log(`- ${e.path} status=${res.status} expected=${e.expect.join(",")}`);

      if (!ok) {
        failures += 1;
        console.error(`  [FAIL] unauthorized beklenirken ${res.status} dondu`);
      }

      if (acao === "*" && acac === "true") {
        failures += 1;
        console.error("  [FAIL] CORS wildcard + credentials riski");
      }
    } catch (err) {
      console.error(`- ${e.path} baglanti hatasi: ${String(err)}`);
      console.error("  [INFO] Uygulama calismiyorsa APP_BASE_URL ile calisan ortami belirtin.");
      process.exit(2);
    }
  }

  try {
    const csrfRes = await request("/api/user/update-consent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: "https://evil.example",
      },
      body: JSON.stringify({ marketingConsent: true }),
      redirect: "manual",
    });

    if (![401, 403].includes(csrfRes.status)) {
      failures += 1;
      console.error(`[FAIL] CSRF smoke: beklenen 401/403, gelen ${csrfRes.status}`);
    } else {
      console.log(`[OK] CSRF smoke status=${csrfRes.status}`);
    }
  } catch (err) {
    console.error(`[WARN] CSRF smoke calismadi: ${String(err)}`);
  }

  if (failures > 0) {
    console.error(`[dast-smoke] fail count=${failures}`);
    process.exit(1);
  }

  console.log("[dast-smoke] basarili.");
}

main();
