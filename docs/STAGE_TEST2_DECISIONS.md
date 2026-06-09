# Stage TEST2 Decisions

## Scope

- TEST2 只收敛 automation execution stability，不改产品语义。
- 保持 OPS2 / DATA2 / OPS3 / TEST1 的功能边界不变。
- 核心目标是让 shared runtime fixture、selected/current、canonical reports 在并发下可解释、可恢复。

## Decision Summary

- 区分 `read_only` / `report_only` / `stateful_runtime` / `stateful_publish` / `stateful_import`。
- `report_only` 可在 run sandbox 中并行执行，不直接覆盖 canonical output。
- `stateful_*` 统一通过 `runtime-state` lock 进入。
- `selected/current/index` 与 canonical json/text 采用 atomic write。
- `output/runs/<run-id>/` 作为每次 automation 的 sandbox 根目录。
- 异常退出后优先恢复 baseline/current/selected；失败 sandbox 保留用于调试。
