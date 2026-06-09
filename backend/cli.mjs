import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runBackendSmoke } from "./index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const outDir = path.join(repoRoot, "output", "stage-d");
const outFile = path.join(outDir, "backend-smoke.json");

fs.mkdirSync(outDir, { recursive: true });
const result = runBackendSmoke();
fs.writeFileSync(outFile, JSON.stringify(result, null, 2) + "\n");
console.log(JSON.stringify({ status: "ok", outFile, surfaceCount: result.surfaces.length }, null, 2));
