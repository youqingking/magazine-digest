# Stage DATA1D Scenario Lifecycle

## States

- `active`
- `retired`

## Lifecycle

1. importer 生成具名 scenario bundle。
2. scenario 进入 registry，但默认不发布到 current。
3. 运营或工程通过 `select` 选择目标 scenario。
4. 通过 `publish` 将 selected scenario 镜像到 `current`。
5. 若需要回退，通过 `rollback` 恢复到 baseline。
6. preview scenario 若不再使用，可 `retire`。

## Current Mirror Boundary

- `mobile/fixtures/runtime/current/*` 只是 selected scenario 的镜像。
- 真实来源必须追溯到 `mobile/fixtures/runtime/scenarios/*.bundle.json`。
