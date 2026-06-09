import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collectStageH1AStatus } from "../contracts/validate-stage-h1a.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, "output", "stage-h1a");
const smokePath = path.join(outDir, "smoke-stage-h1a.json");
const issuesPath = path.join(outDir, "issues.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

export function runStageH1ASmoke() {
  fs.mkdirSync(outDir, { recursive: true });

  const validation = collectStageH1AStatus();
  const issues = fs.existsSync(issuesPath) ? readJson(issuesPath) : [];

  const report = {
    status: "ok",
    stage: "H1A_PAYMENT_READINESS",
    generated_at: new Date().toISOString(),
    readiness_smoke_only: true,
    real_payment_attempted: false,
    main_project_order_path_touched: false,
    main_project_webhook_touched: false,
    docs_and_config_slots_complete: validation.docs_complete,
    route_decision: {
      project_type: validation.project_type,
      payment_plugin_route: validation.payment_plugin_route
    },
    checklist_status: {
      merchant_inputs_documented: validation.merchant_inputs_documented,
      example_runbook_documented: validation.example_runbook_documented,
      h1b_entry_conditions_documented: validation.h1b_entry_conditions_documented
    },
    readiness: {
      h1a_complete: validation.h1a_complete ? "YES" : "NO",
      h1b_ready: validation.h1b_ready ? "YES" : "NO"
    },
    issues_summary: {
      total: issues.length,
      needs_human: issues.filter((issue) => issue.needs_human).length,
      blockers: issues.filter((issue) => issue.severity === "blocker").length,
      warnings: issues.filter((issue) => issue.severity === "warning").length
    }
  };

  fs.writeFileSync(smokePath, JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(JSON.stringify(report, null, 2));
  return report;
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isDirectRun) {
  runStageH1ASmoke();
}
