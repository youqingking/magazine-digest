import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const lockRoot = path.join(repoRoot, "output", "locks");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function lockPath(name) {
  return path.join(lockRoot, `${name}.lock.json`);
}

function nowIso() {
  return new Date().toISOString();
}

export async function acquireStateLock(name, options = {}) {
  fs.mkdirSync(lockRoot, { recursive: true });
  const runId = options.runId || process.env.RUN_ID || "manual";
  const timeoutMs = Number(options.timeoutMs ?? process.env.STATE_LOCK_TIMEOUT_MS ?? 30000);
  const pollMs = Number(options.pollMs ?? process.env.STATE_LOCK_POLL_MS ?? 500);
  const staleMs = Number(options.staleMs ?? process.env.STATE_LOCK_STALE_MS ?? 10 * 60 * 1000);
  const failFast = options.failFast === true || process.env.STATE_LOCK_FAIL_FAST === "1";
  const filePath = lockPath(name);
  const started = Date.now();
  const payload = {
    lock_name: name,
    owner: options.owner || options.script || process.argv[1] || "unknown",
    run_id: runId,
    pid: process.pid,
    started_at: nowIso()
  };

  while (true) {
    try {
      const handle = fs.openSync(filePath, "wx");
      fs.writeFileSync(handle, JSON.stringify(payload, null, 2) + "\n", "utf8");
      fs.closeSync(handle);
      return { name, filePath, payload };
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      let stale = false;
      try {
        const existing = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const startedAt = existing.started_at ? new Date(existing.started_at).getTime() : 0;
        stale = !startedAt || Number.isNaN(startedAt) || (Date.now() - startedAt > staleMs);
      } catch {
        stale = true;
      }
      if (stale) {
        fs.rmSync(filePath, { force: true });
        continue;
      }
      if (failFast || Date.now() - started > timeoutMs) {
        const existing = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, "utf8")) : null;
        const conflict = new Error(`STATE_LOCK_BUSY:${name}`);
        conflict.code = "STATE_LOCK_BUSY";
        conflict.lock = existing;
        throw conflict;
      }
      await sleep(pollMs);
    }
  }
}

export function releaseStateLock(lock) {
  if (!lock?.filePath) return;
  fs.rmSync(lock.filePath, { force: true });
}

export function readLocks() {
  fs.mkdirSync(lockRoot, { recursive: true });
  return fs.readdirSync(lockRoot)
    .filter((name) => name.endsWith(".lock.json"))
    .map((name) => {
      const filePath = path.join(lockRoot, name);
      return {
        file: filePath,
        payload: JSON.parse(fs.readFileSync(filePath, "utf8"))
      };
    });
}
