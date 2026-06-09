import { generatedResourceRegistry } from "../modules/generated/generated-registry.js";

export const generatedResourceKeys = generatedResourceRegistry.map(
  (item) => item.resource
);
