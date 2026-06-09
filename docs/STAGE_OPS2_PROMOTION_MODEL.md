# Stage OPS2 Promotion Model

## Default Operator Flow

1. `inspect-scenario`
2. `compare-scenarios`
3. `run-gate`
4. `evaluate-promotion`
5. `promote-scenario --dry-run`
6. `promote-scenario --apply` when explicitly intended
7. `rollback-scenario` if recovery is needed

## Inputs

- scenario registry: `mobile/fixtures/runtime/scenarios/index.json`
- selected pointer: `mobile/fixtures/runtime/scenarios/selected.json`
- current mirror: `mobile/fixtures/runtime/current/scenario-meta.json`
- metadata quality: `output/stage-data1d/metadata-quality-report.json`
- warning taxonomy: `output/stage-data1d/warning-report.json`
- override report: `output/stage-data1d/override-report.json`
- TEST1 final + subreports: `output/stage-test1/*.json`
- OPS2 diff report: `output/stage-ops2/scenario-diff-report.json`

## Promotion States

- `inspect_only`
  - 仅读取 scenario 与状态，不触发 gate 或 publish
- `compared`
  - 已产出 candidate 相对 `current / selected / baseline` 的 diff
- `gated`
  - 已运行 OPS1 gate / TEST1
- `evaluated`
  - 已合并 diff 与 gate，形成 promotion decision
- `dry_run_ready`
  - 允许执行 dry-run publish 预演
- `applied`
  - 已显式 publish 到 current
- `rolled_back`
  - 已显式恢复到 baseline 或指定 scenario

## Promotion Decision Merge Rules

- `blocked`
  - scenario 不存在
  - scenario 已 retired
  - lifecycle integrity 失败
  - TEST1 / gate blocker 存在
  - baseline / current / selected provenance 断裂
  - diff 发现 blocker-class change
- `hold_warning`
  - 无 blocker
  - 但 diff / quality / warnings / overrides 中存在 warning-class issue
- `promotable`
  - 无 blocker
  - 无未接受 warning
  - gate 通过
  - diff 仅包含 informational 变化或预期变化

## Apply Rules

- 默认不写 `current`
- `--dry-run`
  - 允许写 OPS2 报告与 history
  - 不允许改 `selected/current` runtime state
- `--apply`
  - 必须先得到 `promotable`，或 `hold_warning + --force-with-warning`
  - 不允许跨过 blocker
- `rollback`
  - 必须显式传入目标 scenario
  - 默认用于恢复 baseline 或已知稳定 scenario

## Baseline Rules

- baseline scenario 由显式参数或当前 baseline/current 推导，不允许静默替换
- 若 baseline 缺失、无法解析或与 registry 不一致，promotion 结果直接 `blocked`
- rollback 必须保留 baseline 可恢复能力

## History Rules

以下动作都必须记录到 promotion history：

- inspect
- compare
- gate
- evaluate
- promote dry-run
- promote apply
- rollback

## RC1 Boundary

- RC1 manual runtime closeout 只作为独立 human-only 证据链
- OPS2 promotion decision 不以 RC1 `YES` 作为自动 gate 前置
- OPS2 报告可引用 RC1 状态，但不能声称替代人工 runtime proof
