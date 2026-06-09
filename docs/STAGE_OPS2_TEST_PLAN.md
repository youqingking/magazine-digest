# Stage OPS2 Test Plan

## Scope

- 复用 TEST1、OPS1 gate、DATA1D lifecycle 既有产物
- 验证 OPS2 新增的 diff、promotion decision、dry-run publish、rollback 和 dashboard/history
- 保证 baseline / selected / current 在 smoke 后可恢复

## Required Checks

1. `compare-scenarios` 正确比较 baseline vs mixed preview
2. `evaluate-promotion` 正确区分：
   - single-publication clean candidate -> `promotable`
   - mixed preview -> `hold_warning`
   - missing scenario -> `blocked`
3. `promote-scenario --dry-run` 在 warning 时正确 hold
4. 不存在 scenario 的 promote 直接 blocker
5. `rollback-scenario` 能恢复 baseline
6. promotion 流程不会在 dry-run 下污染长期 `selected/current`
7. TEST1 与 OPS1 gate 不回归

## Command Set

- `node scripts/tests/run-test1.mjs`
- `node scripts/ops/list-scenarios.mjs`
- `node scripts/ops/compare-scenarios.mjs --from data1a_readers_digest_12112025 --to data1c_three_release_mixed_preview`
- `node scripts/ops/run-gate.mjs --scenario data1c_three_release_mixed_preview`
- `node scripts/ops/evaluate-promotion.mjs --scenario data1c_three_release_mixed_preview`
- `node scripts/ops/promote-scenario.mjs --scenario data1c_three_release_mixed_preview --dry-run`
- `node scripts/ops/promote-scenario.mjs --scenario does_not_exist --dry-run`
- `node scripts/ops/rollback-scenario.mjs --scenario data1a_readers_digest_12112025`
- `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/smoke-stage-ops2.ps1`

## Pass Criteria

- `scenario-diff-report.json` 与 `scenario-diff-summary.md` 已生成
- `promotion-evaluation-report.json`、`promotion-dashboard.json`、`promotion-summary.md`、`promotion-history.json` 已生成
- dry-run 不改变 `selected/current`
- rollback 后 `current` 回到 baseline
- 所有 blocker / warning / info 分类稳定可读

## NEED_HUMAN

- 无额外人工 runtime closeout 要求
- RC1 仍独立存在，不作为 OPS2 smoke 前置
