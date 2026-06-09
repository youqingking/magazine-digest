# Stage OPS3 Rollback Policy

## Policy

- OPS3 drill 默认以 rollback 收尾。
- rollback 目标固定为已知稳定 baseline：
  - `data1a_readers_digest_12112025`

## Rules

- rollback 必须显式执行，不依赖隐式清理
- rollback 后必须验证：
  - `selected.json`
  - `current/scenario-meta.json`
  - current mirror provenance
- rollback 不得删除 candidate bundle 或 registry entry
- rollback 失败属于 blocker

## Preview-only Boundary

- preview-only scenario 不允许走真实 apply publish
- 若对 preview-only scenario 执行 `promote-scenario --apply`，应返回拒绝结果
- preview-only reject 不改变 `selected/current`
