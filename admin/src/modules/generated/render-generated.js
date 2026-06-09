import { generatedResourceRegistry } from "./generated-registry.js";

export function renderGeneratedModule(resourceKey) {
  const resource = generatedResourceRegistry.find(
    (item) => item.resource === resourceKey
  );

  if (!resource) {
    return `
      <div class="panel">
        <h2>Missing Generated Resource</h2>
        <p>${resourceKey} is not registered in the generated track.</p>
      </div>
    `;
  }

  return `
    <div class="panel">
      <h2>Generated Track: ${resource.resource}</h2>
      <p>Schema-driven admin rail reserved for generated CRUD and future schema2code output.</p>
      <p><span class="chip">source: ${resource.sourceOfTruth}</span></p>
    </div>
  `;
}
