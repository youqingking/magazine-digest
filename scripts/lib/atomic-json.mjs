import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

function sleepMs(durationMs) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, durationMs);
}

function ensureDir(targetPath) {
  fs.mkdirSync(path.dirname(targetPath), { recursive: true });
}

function tempPathFor(filePath) {
  const suffix = `${process.pid}-${Date.now()}-${crypto.randomUUID()}.tmp`;
  return `${filePath}.${suffix}`;
}

export function atomicWriteText(filePath, value, encoding = "utf8") {
  ensureDir(filePath);
  const tempPath = tempPathFor(filePath);
  fs.writeFileSync(tempPath, value, encoding);
  let lastError = null;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    try {
      fs.renameSync(tempPath, filePath);
      lastError = null;
      break;
    } catch (error) {
      lastError = error;
      if (!["EPERM", "EACCES"].includes(error.code)) {
        break;
      }
      sleepMs(40 * (attempt + 1));
    }
  }
  if (lastError) {
    throw lastError;
  }
}

export function atomicWriteJson(filePath, value) {
  atomicWriteText(filePath, JSON.stringify(value, null, 2) + "\n", "utf8");
}
