# Stage OPS1 Operator Workflow

## Default Flow

1. 将 zip 放入 `ops/intake/inbox/`
2. 执行 `intake`
3. 查看 `operator catalog` / `show-quality`
4. 执行 `select-scenario`
5. 执行 `run-gate`
6. 若 gate 通过，则 `publish-scenario`
7. 若线上需要回退，则 `rollback-scenario`

## Remaining Engineer-only Friction Before OPS1

- 依赖外部绝对路径
- 需要手动翻多个 json/report 才能看质量
- publish 没有自动绑定 gate

## OPS1 After State

- operator 不需要手改 json
- 默认从 repo-local inbox intake
- catalog / dashboard 可直接读
- publish / rollback / retire 都会写历史记录
