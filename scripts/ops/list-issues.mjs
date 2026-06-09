import { buildOperatorCatalog } from "./lib/ops-lib.mjs";

const catalog = buildOperatorCatalog();
console.log(JSON.stringify({ status: "ok", issues: catalog.issues }, null, 2));
