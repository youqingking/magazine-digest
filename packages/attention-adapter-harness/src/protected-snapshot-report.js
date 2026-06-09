import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

function sha256ForFile(absolutePath) {
  return crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
}

function isTracked(repoRoot, relativePath) {
  try {
    execSync(`git ls-files --error-unmatch "${relativePath}"`, {
      cwd: repoRoot,
      stdio: "ignore"
    });
    return true;
  } catch {
    return false;
  }
}

function getChangedTrackedFiles(repoRoot) {
  const output = execSync("git diff --name-only -- docs packages scripts domains", {
    cwd: repoRoot,
    encoding: "utf8"
  }).trim();

  return output ? output.split(/\r?\n/).filter(Boolean) : [];
}

function toSnapshotEntries(repoRoot, protected_paths = []) {
  return protected_paths.map((relativePath) => {
    const absolutePath = path.resolve(repoRoot, relativePath);
    const exists = fs.existsSync(absolutePath);

    return Object.freeze({
      path: relativePath,
      exists,
      tracked: isTracked(repoRoot, relativePath),
      sha256: exists ? sha256ForFile(absolutePath) : null
    });
  });
}

export const protectedSnapshotReportShapeName = "protected_path_snapshot_report";

export function buildProtectedSnapshotReport({
  repo_root,
  protected_paths = [],
  snapshot_path
}) {
  const absoluteSnapshotPath = path.resolve(repo_root, snapshot_path);
  const snapshotExists = fs.existsSync(absoluteSnapshotPath);
  const currentEntries = toSnapshotEntries(repo_root, protected_paths);
  const changedTrackedFiles = getChangedTrackedFiles(repo_root);

  if (!snapshotExists) {
    const baselineSnapshot = Object.freeze({
      generated_at: new Date().toISOString(),
      snapshot_version: "0.0.0-step07",
      mode: "baseline",
      baseline_snapshot_generated: true,
      protected_path_count: currentEntries.length,
      entries: currentEntries
    });

    fs.mkdirSync(path.dirname(absoluteSnapshotPath), { recursive: true });
    fs.writeFileSync(absoluteSnapshotPath, `${JSON.stringify(baselineSnapshot, null, 2)}\n`, "utf8");

    return Object.freeze({
      ok: currentEntries.every((entry) => entry.exists),
      snapshot_written: true,
      baseline_snapshot_generated: true,
      mode: "baseline",
      snapshot_path,
      entries: currentEntries,
      missing_paths: Object.freeze(currentEntries.filter((entry) => !entry.exists).map((entry) => entry.path)),
      hash_mismatches: Object.freeze([]),
      tracked_git_diffs: Object.freeze(changedTrackedFiles.filter((file) => protected_paths.includes(file)))
    });
  }

  const storedSnapshot = JSON.parse(fs.readFileSync(absoluteSnapshotPath, "utf8"));
  const storedByPath = Object.fromEntries((storedSnapshot.entries || []).map((entry) => [entry.path, entry]));
  const hash_mismatches = [];
  const missing_paths = [];

  const entries = currentEntries.map((entry) => {
    const previous = storedByPath[entry.path] || {};
    const hash_matches_snapshot = previous.sha256 === entry.sha256;

    if (!entry.exists) {
      missing_paths.push(entry.path);
    } else if (!hash_matches_snapshot) {
      hash_mismatches.push(entry.path);
    }

    return Object.freeze({
      ...entry,
      snapshot_sha256: previous.sha256 ?? null,
      hash_matches_snapshot
    });
  });

  return Object.freeze({
    ok: missing_paths.length === 0 && hash_mismatches.length === 0,
    snapshot_written: false,
    baseline_snapshot_generated: false,
    mode: "verification",
    snapshot_path,
    entries: Object.freeze(entries),
    missing_paths: Object.freeze(missing_paths),
    hash_mismatches: Object.freeze(hash_mismatches),
    tracked_git_diffs: Object.freeze(changedTrackedFiles.filter((file) => protected_paths.includes(file)))
  });
}
