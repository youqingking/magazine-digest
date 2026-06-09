import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const maxAgeHoursIndex = args.indexOf("--max-age-hours");
const maxAgeHours = maxAgeHoursIndex >= 0 ? Number(args[maxAgeHoursIndex + 1]) : 24;
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const runsRoot = path.join(repoRoot, "output", "runs");
const cutoff = Date.now() - maxAgeHours * 60 * 60 * 1000;
const removed = [];

if (fs.existsSync(runsRoot)) {
  for (const name of fs.readdirSync(runsRoot)) {
    const target = path.join(runsRoot, name);
    const stats = fs.statSync(target);
    if (stats.mtimeMs < cutoff) {
      fs.rmSync(target, { recursive: true, force: true });
      removed.push(name);
    }
  }
}

console.log(JSON.stringify({
  status: "ok",
  cleanup: {
    generated_at: new Date().toISOString(),
    max_age_hours: maxAgeHours,
    removed
  }
}, null, 2));
