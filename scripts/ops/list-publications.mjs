import { buildOperatorCatalog } from "./lib/ops-lib.mjs";

const catalog = buildOperatorCatalog();
console.log(JSON.stringify({ status: "ok", publications: catalog.publications }, null, 2));
