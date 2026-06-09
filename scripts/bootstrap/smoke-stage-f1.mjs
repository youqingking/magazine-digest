import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLocalBackendRuntime } from "../../backend/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, "output", "stage-f1");
const outFile = path.join(outDir, "smoke-stage-f1.json");

fs.mkdirSync(outDir, { recursive: true });

const runtime = createLocalBackendRuntime();
const home = runtime.surfaces["home-discovery"]({
  product_key: runtime.runtimeConfig.productKey,
  user_id: "user_local_stage_e0",
  installation_id: "inst_stage_f1_smoke"
});
const inbox = runtime.surfaces["notification-inbox"]({
  product_key: runtime.runtimeConfig.productKey,
  user_id: "user_local_stage_e0",
  status_filter: "all"
});
const search = runtime.surfaces["search-content"]({
  product_key: runtime.runtimeConfig.productKey,
  user_id: "user_local_stage_e0",
  query: "",
  filters: {}
});

const report = {
  status: "ok",
  generated_at: new Date().toISOString(),
  scenario_id: runtime.repository.currentRuntimeBundle?.metadata?.scenario_id || null,
  checks: {
    home_modules: home.modules.map((item) => item.section_key),
    inbox_items: inbox.items.length,
    search_items: search.items.length
  }
};

fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
