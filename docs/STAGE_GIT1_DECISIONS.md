# Stage GIT1 Decisions

## Scope

- 将当前跨 UI2/UI3/UI3.5-partial/DATA1A-D/TEST1/OPS1 的工作树收成一个诚实的合并基线。
- 不补录过去 stage 的独立历史，不伪造旧 tag。
- 优先保留源码、脚本、registry、scenario、override、canonical docs 与 canonical reports。

## Baseline Coverage

本次 consolidated baseline 覆盖：

- `UI2`
- `UI3`
- `UI3.5` partial closeout artifacts
- `DATA1A`
- `DATA1B`
- `DATA1C`
- `DATA1D`
- `TEST1`
- `OPS1`

## Key Decisions

- `mobile/fixtures/runtime/current/*` 继续 tracked，因为 app 默认本地运行与 deterministic smoke 直接依赖 current mirror。
- `mobile/fixtures/runtime/scenarios/*`、`data/real-content/*`、`data/real-content/overrides/*`、registry/index/selected pointer 视为 baseline source of truth。
- `mobile/unpackage/*` 视为本机构建产物，不再纳入基线。
- `mobile/.hbuilderx/*` 视为本机 IDE 配置，不再纳入基线。
- `output/stage-data1c/extracted/*` 视为导入中间展开目录，不纳入基线。
- `ops/intake/inbox/*.zip` 与 `ops/intake/archive/*.zip` 保留 repo-local 目录结构，但不纳入 git 基线。

## Honest Versioning Statement

- 本次 commit/tag 是“当前状态的合并基线”。
- 它不是对历史 stage 的逐段补录。
- 后续 stage 从这次 checkpoint 起执行独立 commit/tag 纪律。
