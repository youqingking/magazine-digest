import path from "node:path";

const runRoot = process.env.RUN_CONTEXT_ROOT ? path.resolve(process.env.RUN_CONTEXT_ROOT) : null;

export function hasRunSandbox() {
  return Boolean(runRoot);
}

export function getRunSandboxRoot() {
  return runRoot;
}

export function resolveSandboxPath(repoRoot, canonicalPath) {
  if (!runRoot) return canonicalPath;
  const relativePath = path.relative(repoRoot, canonicalPath);
  if (relativePath.startsWith("..")) return canonicalPath;
  if (!relativePath.startsWith("output")) return canonicalPath;
  return path.join(runRoot, relativePath);
}

export function isSandboxOnly() {
  return process.env.RUN_SANDBOX_ONLY === "1";
}
