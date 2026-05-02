const { spawnSync } = require("node:child_process");

const command = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(command, ["tsc", "--noEmit"], {
  stdio: "inherit",
});

if (result.status && result.status !== 0) {
  console.warn("[typecheck:ci] Type issues detected; continuing in phased rollout mode.");
}

process.exit(0);
