# Stage REL1 Rollback Model

- scenario rollback 与 channel rollback 保持分离。
- scenario rollback 继续恢复 `selected/current` current mirror。
- channel rollback 只恢复 channel head，不直接改动 `mobile/fixtures/runtime/current/*`。
- dev-only runtime source 可指向 channel head；此时 rollback 后 app 看到的是新的 channel head。
- 每次 channel publish / promote / rollback 都必须写入 channel history。
- channel rollback 必须记录：
  - `rolled_back_from`
  - `rolled_back_to`
  - `rolled_back_at`
  - `reason`
