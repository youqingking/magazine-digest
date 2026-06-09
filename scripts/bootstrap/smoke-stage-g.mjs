import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createLocalBackendRuntime } from "../../backend/index.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..", "..");
const outDir = path.join(repoRoot, "output", "stage-g");
const outFile = path.join(outDir, "smoke-stage-g.json");

fs.mkdirSync(outDir, { recursive: true });

const runtime = createLocalBackendRuntime();
const productKey = runtime.runtimeConfig.productKey;

const report = {
  status: "ok",
  generated_at: new Date().toISOString(),
  scenario_id: runtime.repository.currentRuntimeBundle?.metadata?.scenario_id || null,
  checks: {
    commercial_offer: runtime.surfaces["commercial-offer"]({ product_key: productKey }),
    quota_status: runtime.surfaces["quota-status"]({ product_key: productKey }),
    promo_preview: runtime.surfaces["promo-preview"]({
      product_key: productKey,
      pricing_plan_id: "plan_demo_monthly",
      promo_code: "BETA30A001"
    }),
    referral_summary: runtime.surfaces["referral-summary"]({ product_key: productKey }),
    reward_summary: runtime.surfaces["reward-summary"]({ product_key: productKey }),
    campaign_landing: runtime.surfaces["campaign-landing"]({ product_key: productKey }),
    profile_benefits: runtime.surfaces["profile-benefits"]({ product_key: productKey })
  }
};

fs.writeFileSync(outFile, JSON.stringify(report, null, 2) + "\n", "utf8");
console.log(JSON.stringify(report, null, 2));
