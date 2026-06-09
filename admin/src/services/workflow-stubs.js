import { manualModuleRegistry } from "../modules/manual/manual-registry.js";

export const manualWorkflowKeys = manualModuleRegistry.map(
  (item) => item.moduleKey
);
