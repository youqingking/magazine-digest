import { generatedResourceRegistry } from "../modules/generated/generated-registry.js";
import { manualModuleRegistry } from "../modules/manual/manual-registry.js";

export function createAdminApi() {
  return {
    getGeneratedResources() {
      return generatedResourceRegistry;
    },
    getManualModules() {
      return manualModuleRegistry;
    }
  };
}
