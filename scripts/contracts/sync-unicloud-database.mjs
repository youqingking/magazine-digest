import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const sourceDir = path.join(repoRoot, "database");
const targetDir = path.join(repoRoot, "mobile", "uniCloud-aliyun", "database");

fs.mkdirSync(targetDir, { recursive: true });

const files = fs
  .readdirSync(sourceDir)
  .filter((name) => name.endsWith(".schema.json"))
  .sort();

for (const file of files) {
  fs.copyFileSync(path.join(sourceDir, file), path.join(targetDir, file));
}

const manifest = {
  syncedAt: new Date().toISOString(),
  sourceDir: "database",
  targetDir: "mobile/uniCloud-aliyun/database",
  fileCount: files.length,
  files
};

fs.writeFileSync(
  path.join(targetDir, "_sync-manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n"
);

console.log(JSON.stringify(manifest, null, 2));
