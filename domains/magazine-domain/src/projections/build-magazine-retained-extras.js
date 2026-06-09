import { buildRetainedExtras } from "../../../../packages/attention-adapter-runtime/src/build-retained-extras.js";

const magazineDomainExtras = Object.freeze([
  "issue_id",
  "issue_label",
  "start_page",
  "print_taxonomy_path",
  "cover_slot"
]);

export function buildMagazineRetainedExtras({ mapping_execution } = {}) {
  return buildRetainedExtras({
    adapter_only_extras: [],
    domain_only_extras:
      mapping_execution?.retained_extras?.length > 0 ? mapping_execution.retained_extras : magazineDomainExtras
  });
}
