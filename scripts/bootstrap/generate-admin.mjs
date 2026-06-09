import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const outDir = path.join(repoRoot, "admin", "pages-generated");
const generatedModuleDir = path.join(
  repoRoot,
  "admin",
  "src",
  "modules",
  "generated"
);

const resources = [
  { resource: "products", mode: "generated" },
  { resource: "publications", mode: "generated" },
  { resource: "articles", mode: "generated" },
  { resource: "pricing_plans", mode: "generated" },
  { resource: "quota_policies", mode: "generated" },
  { resource: "promo_campaigns", mode: "generated" },
  { resource: "promo_codes", mode: "generated" },
  { resource: "referrals", mode: "generated" },
  { resource: "reward_ledger", mode: "generated" },
  { resource: "feature_flags", mode: "generated" },
  { resource: "experiments", mode: "generated" },
  { resource: "publish_batches", mode: "generated" },
  { resource: "notification_campaigns", mode: "generated" },
  { resource: "user_notification_prefs", mode: "generated" },
  { resource: "notification_inbox", mode: "generated" },
  { resource: "user_follows", mode: "generated" },
  { resource: "user_content_state", mode: "generated" }
];

fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(generatedModuleDir, { recursive: true });

for (const resource of resources) {
  const filePath = path.join(outDir, resource.resource + ".generated.json");
  const payload = {
    resource: resource.resource,
    track: resource.mode,
    generatedAt: new Date().toISOString(),
    status: "stage-d-foundation",
    sourceOfTruth: "database/" + resource.resource + ".schema.json"
  };
  fs.writeFileSync(filePath, JSON.stringify(payload, null, 2) + "\n");
}

const registry = {
  generatedAt: new Date().toISOString(),
  resourceCount: resources.length,
  resources: resources.map((resource) => ({
    resource: resource.resource,
    track: resource.mode,
    sourceOfTruth: "database/" + resource.resource + ".schema.json"
  }))
};

fs.writeFileSync(
  path.join(outDir, "registry.generated.json"),
  JSON.stringify(registry, null, 2) + "\n"
);

const generatedRegistryModule = `export const generatedResourceRegistry = ${JSON.stringify(
  registry.resources,
  null,
  2
)};\n`;

fs.writeFileSync(
  path.join(generatedModuleDir, "generated-registry.js"),
  generatedRegistryModule
);

console.log(
  JSON.stringify(
    {
      outDir,
      resources: registry.resources.map((resource) => resource.resource),
      resourceCount: registry.resourceCount
    },
    null,
    2
  )
);
