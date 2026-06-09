import { createAdminContractMap } from "./services/contract-map.js";
import { createAdminApi } from "./api/local-runtime-api.js";
import { generatedResourceKeys } from "./services/generated-resources.js";
import { manualWorkflowKeys } from "./services/workflow-stubs.js";
import { getRoutes } from "./routes.js";
import { renderGeneratedModule } from "./modules/generated/render-generated.js";
import { renderManualModule } from "./modules/manual/render-manual.js";

const app = document.getElementById("app");
const contractMap = createAdminContractMap();
const adminApi = createAdminApi();

function renderDashboard() {
  const generatedResources = adminApi.getGeneratedResources();
  const manualModules = adminApi.getManualModules();

  return `
    <div class="panel">
      <h2>Admin Foundation Dashboard</h2>
      <p>Stage H0 keeps admin on generated/manual dual rails and adds remote runtime, auth, device, and push foundation inspection on top of the local fixture-backed baseline.</p>
      <p>
        <span class="chip">timezone: ${contractMap.timezone}</span>
        <span class="chip">discount: ${contractMap.discountCanonical}</span>
        <span class="chip">reward: ${contractMap.rewardCanonical}</span>
        <span class="chip">runtime: ${contractMap.runtimeMode}</span>
        <span class="chip">inbox: ${contractMap.inboxTruth}</span>
        <span class="chip">push: ${contractMap.pushTransport}</span>
      </p>
      <p>Generated resources: ${generatedResources.length}</p>
      <p>Manual modules: ${manualModules.length}</p>
    </div>
  `;
}

function render() {
  const hash = window.location.hash || "#/";
  const routes = getRoutes();
  const nav = routes
    .map((route) => `<a href="${route.path}">${route.label}</a>`)
    .join("");

  let content = renderDashboard();

  if (hash.startsWith("#/generated/")) {
    const resourceKey = hash.replace("#/generated/", "");
    content = renderGeneratedModule(resourceKey);
  } else if (hash.startsWith("#/manual/")) {
    const workflowKey = hash.replace("#/manual/", "");
    content = renderManualModule(workflowKey);
  }

  app.innerHTML = `
    <div class="layout">
      <aside class="sidebar">
        <h1>Stage G Admin</h1>
        <p>Generated: ${generatedResourceKeys.length}</p>
        <p>Manual: ${manualWorkflowKeys.length}</p>
        ${nav}
      </aside>
      <main class="content">${content}</main>
    </div>
  `;
}

window.addEventListener("hashchange", render);
render();
