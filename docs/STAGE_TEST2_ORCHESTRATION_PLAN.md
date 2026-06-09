# Stage TEST2 Orchestration Plan

## Runner

- 新增 `scripts/ops/run-automation-suite.mjs`
- 输入 script profiles
- 为每个 command 分配 run context / sandbox

## Execution Policy

1. `read_only` / `report_only`
   - 允许并行
   - 默认写 sandbox
2. `stateful_*`
   - 获取 `runtime-state` lock
   - 失败时 fail-fast
   - 必须执行恢复检查

## Recovery

- 使用 snapshot 恢复 baseline/current/selected
- stale lock 可由 recovery script 清理
- failed sandbox 保留
- success sandbox 可清理
