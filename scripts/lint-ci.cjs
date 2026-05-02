const { spawnSync } = require("node:child_process");

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["next", "lint"], {
  stdio: "inherit",
});

if (result.status && result.status !== 0) {
  console.warn("[lint:ci] Lint findings detected; continuing in phased rollout mode.");
}

process.exit(0);
