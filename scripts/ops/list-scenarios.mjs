import { buildOperatorCatalog, listScenarioView } from "./lib/ops-lib.mjs";

buildOperatorCatalog();
console.log(JSON.stringify({ status: "ok", ...listScenarioView() }, null, 2));
