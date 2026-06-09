# Stage DATA1D Publish Controls

## Scripts

- `node scripts/runtime/list-scenarios.mjs`
- `node scripts/runtime/select-scenario.mjs <scenario_id>`
- `node scripts/runtime/publish-scenario.mjs [scenario_id]`
- `node scripts/runtime/rollback-scenario.mjs <scenario_id>`
- `node scripts/runtime/retire-scenario.mjs <scenario_id>`

## Semantics

- `select`：只改变 selected pointer，不自动覆盖 current。
- `publish`：将 selected scenario 或显式指定 scenario 发布到 `current` mirror。
- `rollback`：显式将某个已知 scenario 重新发布到 `current`。
- `retire`：将 preview scenario 标记为 retired，不物理删除 bundle。

## Safety Rules

- baseline scenario 不得被静默替换。
- mixed preview 不自动升为 current。
- 所有动作都落盘到 registry / selected / current mirror metadata。
