# Stage OPS3 Drill Plan

## Target

- apply target:
  - `data2_multi_publication_release_candidate`
- reject target:
  - `data1c_three_release_mixed_preview`

## Drill Steps

1. `inspect-scenario`
2. `compare-scenarios`
3. `run-gate`
4. `evaluate-promotion`
5. `show-release-manifest`
6. `generate-release-notes`
7. `capture-scenario-snapshot --label pre-publish`
8. `promote-scenario --apply`
9. verify selected/current/dashboard/history
10. `capture-scenario-snapshot --label post-publish`
11. `rollback-scenario --scenario data1a_readers_digest_12112025`
12. `capture-scenario-snapshot --label post-rollback`

## Required Checks

- apply target 必须是 `promotable`
- preview-only target 必须被 `--apply` 拒绝
- rollback 后 baseline 恢复
- drill 产物全部落盘到 `output/stage-ops3/`

## Persistence Rules

- apply 与 rollback 都必须写历史记录
- pre / post / rollback 三个 snapshot 必须保留
- 若 drill 失败，仍应尝试恢复 baseline
