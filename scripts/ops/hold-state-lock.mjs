import { acquireStateLock, releaseStateLock } from "../lib/state-lock.mjs";

const ms = Number(process.argv[2] || 3000);
let lock = null;

try {
  lock = await acquireStateLock("runtime-state", {
    runId: process.env.RUN_ID || "hold-state-lock",
    script: "scripts/ops/hold-state-lock.mjs"
  });
  console.log(JSON.stringify({
    status: "locked",
    lock: lock.payload,
    hold_ms: ms
  }, null, 2));
  await new Promise((resolve) => setTimeout(resolve, ms));
  console.log(JSON.stringify({
    status: "ok",
    released: true,
    hold_ms: ms
  }, null, 2));
} finally {
  releaseStateLock(lock);
}
