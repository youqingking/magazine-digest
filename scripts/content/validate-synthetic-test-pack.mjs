import fs from "node:fs";
import path from "node:path";
import { loadCatalog, paths, validateCatalog } from "./synthetic-test-pack-lib.mjs";

try {
  const validation = validateCatalog(loadCatalog());
  if (!validation.valid) {
    console.error(JSON.stringify(validation, null, 2));
    process.exit(1);
  }
  fs.mkdirSync(paths.outputReportsRoot, { recursive: true });
  fs.writeFileSync(
    path.join(paths.outputReportsRoot, "validation-report.json"),
    JSON.stringify({ status: "ok", generated_at: new Date().toISOString(), summary: validation.summary }, null, 2) + "\n",
    "utf8"
  );
  console.log(JSON.stringify({ status: "ok", summary: validation.summary }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ status: "error", message: error.message }, null, 2));
  process.exit(1);
}
