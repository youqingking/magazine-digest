import { buildOperatorCatalog } from "./lib/ops-lib.mjs";

const catalog = buildOperatorCatalog();
console.log(JSON.stringify({
  status: "ok",
  issues: catalog.issues.map((item) => ({
    issue_id: item.issue_id,
    parser_profile: item.parser_profile,
    article_count: item.article_count,
    warnings_count: item.warnings_count,
    unresolved_warnings_count: item.unresolved_warnings_count,
    overrides_count: item.overrides_count,
    warning_types: item.warning_types
  }))
}, null, 2));
