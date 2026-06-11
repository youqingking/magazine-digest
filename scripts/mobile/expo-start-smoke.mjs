#!/usr/bin/env node

import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "../..");
const mobileDir = path.join(repoRoot, "apps/mobile");
const port = Number(process.env.MOBILE_EXPO_SMOKE_PORT || "19001");
const timeoutMs = Number(process.env.MOBILE_EXPO_SMOKE_TIMEOUT_MS || "45000");

const expoCliCandidates = [
  path.join(mobileDir, "node_modules/@expo/cli/build/bin/cli"),
  path.join(repoRoot, "node_modules/@expo/cli/build/bin/cli")
];

const expoCli = expoCliCandidates.find((candidate) => existsSync(candidate));

if (!expoCli) {
  console.log("MOBILE_EXPO_START_SMOKE_TOOL_MISSING");
  console.log("classification=tool_missing");
  console.log("missing=local @expo/cli entry; run npm.cmd install from the repository root");
  process.exit(2);
}

const child = spawn(process.execPath, [expoCli, "start", "--localhost", "--port", String(port)], {
  cwd: mobileDir,
  env: {
    ...process.env,
    CI: "1",
    EXPO_NO_TELEMETRY: "1",
    EXPO_NO_TYPESCRIPT_SETUP: "1",
    EXPO_PUBLIC_RUNTIME_SCENARIO_ID: process.env.EXPO_PUBLIC_RUNTIME_SCENARIO_ID || "s01_normal_full_matrix"
  },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true
});

let output = "";
let finished = false;

child.stdout.on("data", (chunk) => {
  output += chunk.toString();
});

child.stderr.on("data", (chunk) => {
  output += chunk.toString();
});

child.on("exit", (code) => {
  if (!finished) {
    finished = true;
    console.log("MOBILE_EXPO_START_SMOKE_FAILED");
    console.log(`classification=expo_start_exited code=${code}`);
    console.log(output.trim());
    process.exit(code || 1);
  }
});

const deadline = Date.now() + timeoutMs;

while (Date.now() < deadline) {
  const status = await readMetroStatus(port);
  if (status.includes("running") || output.includes(`Waiting on http://localhost:${port}`)) {
    finished = true;
    await stopChild(child);
    console.log("MOBILE_EXPO_START_SMOKE_PASSED");
    console.log(`expo_url=http://localhost:${port}`);
    console.log(`metro_status=${status.includes("running") ? "running" : "not_checked_by_endpoint"}`);
    console.log("fixture_scenario=s01_normal_full_matrix");
    process.exit(0);
  }

  await delay(750);
}

finished = true;
await stopChild(child);
console.log("MOBILE_EXPO_START_SMOKE_UNPROVEN");
console.log("classification=start_timeout");
console.log(`timeout_ms=${timeoutMs}`);
console.log(output.trim());
process.exit(1);

async function readMetroStatus(portNumber) {
  try {
    const response = await fetch(`http://127.0.0.1:${portNumber}/status`);
    return await response.text();
  } catch {
    return "";
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function stopChild(childProcess) {
  if (childProcess.exitCode !== null || childProcess.killed) {
    return;
  }

  if (process.platform === "win32") {
    spawnSync("taskkill.exe", ["/pid", String(childProcess.pid), "/t", "/f"], {
      stdio: "ignore",
      windowsHide: true
    });
    return;
  }

  childProcess.kill("SIGTERM");
  await Promise.race([
    new Promise((resolve) => childProcess.once("exit", resolve)),
    delay(3000).then(() => {
      if (childProcess.exitCode === null && !childProcess.killed) {
        childProcess.kill("SIGKILL");
      }
    })
  ]);
}
