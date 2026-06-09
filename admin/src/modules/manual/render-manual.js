import { manualModuleRegistry } from "./manual-registry.js";

export function renderManualModule(moduleKey) {
  const module = manualModuleRegistry.find((item) => item.moduleKey === moduleKey);

  if (!module) {
    return `
      <div class="panel">
        <h2>Missing Manual Module</h2>
        <p>${moduleKey} is not registered in the manual track.</p>
      </div>
    `;
  }

  const detailMap = {
    runtime_mode_inspector: "Shows the dev-safe local / hybrid / remote seam and reminds operators that hybrid falls back to local fixtures.",
    push_capability_inspector: "Maps installation, cid presence, permission state, and push app id without acting as a send console.",
    delivery_preview_inspector: "Shows quiet hours suppression, dedupe, digest queueing, and eligible transport decisions while inbox stays canonical.",
    auth_session_config_inspector: "Shows uni-id-ready auth session, refresh, and signout contract placeholders without introducing a full account workflow."
  };

  return `
    <div class="panel">
      <h2>${module.title}</h2>
      <p>Manual shell only for Stage H0 foundation mapping.</p>
      <p><span class="chip">reason: ${module.reason}</span></p>
      <p>${detailMap[moduleKey] || "Foundation shell only."}</p>
    </div>
  `;
}
