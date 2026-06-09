# Stage DATA2 Test Plan

## Scope

- 验证 DATA2 的 warning budget、accepted anomaly registry、release-candidate scenario 和 promotion readiness 收敛。
- 继续依赖 TEST1 + OPS2，不另起一套平行测试框架。

## Required Checks

1. mixed preview 的 hold 原因被量化并落盘
2. accepted warnings / budgets 被 OPS2 promotion decision 消费
3. `data2_multi_publication_release_candidate` 被成功生成
4. 四刊 candidate 在 `evaluate-promotion` 下达到 `promotable`
5. 新 candidate 在 `promote-scenario --dry-run` 下通过且不污染 `selected/current`
6. baseline scenario 保留
7. TEST1 / OPS2 既有验证不回归

## Command Set

- `node scripts/ops/show-quality-drift.mjs`
- `node scripts/ops/show-warning-budget.mjs`
- `node scripts/ops/build-release-candidate.mjs`
- `node scripts/ops/evaluate-promotion.mjs --scenario data2_multi_publication_release_candidate --use-existing-reports`
- `node scripts/ops/promote-scenario.mjs --scenario data2_multi_publication_release_candidate --dry-run --use-existing-reports`
- `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/smoke-stage-data2.ps1`

## Pass Criteria

- `output/stage-data2/*.json` 关键产物已生成
- mixed preview 仍可解释为 `hold_warning`
- release candidate 为 `promotable`
- release candidate 的 `included_publications` 覆盖四刊
- dry-run 后 `selected/current` 与 baseline 前一致
