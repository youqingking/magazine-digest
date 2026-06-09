# Stage TEST2 Locking Policy

## Lock Scope

统一 lock 名称：

- `runtime-state`

保护路径：

- `mobile/fixtures/runtime/current/*`
- `mobile/fixtures/runtime/scenarios/selected.json`
- `mobile/fixtures/runtime/scenarios/index.json`
- stateful publish / rollback history

## Rules

- `stateful_runtime`
- `stateful_publish`
- `stateful_import`

以上 profile 必须持锁运行。

- `read_only` / `report_only` 不获取 lock，可继续运行。
- lock 文件记录：
  - owner
  - run_id
  - pid
  - started_at
- stale lock 支持超时清理。
