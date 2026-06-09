import { generatedResourceKeys } from "./services/generated-resources.js";
import { manualWorkflowKeys } from "./services/workflow-stubs.js";

export function getRoutes() {
  const generatedRoutes = generatedResourceKeys.map((resourceKey) => ({
    path: "#/generated/" + resourceKey,
    label: resourceKey,
    type: "generated"
  }));

  const manualRoutes = manualWorkflowKeys.map((resourceKey) => ({
    path: "#/manual/" + resourceKey,
    label: resourceKey,
    type: "manual"
  }));

  return [
    {
      path: "#/",
      label: "dashboard",
      type: "dashboard"
    },
    ...generatedRoutes,
    ...manualRoutes
  ];
}
