# Stage GIT1 Inventory

## Worktree Overview

当前工作树同时包含以下类型改动：

- UI shell 与页面收口源码
- real-content pipeline、parser、override、registry、scenario
- deterministic regression tests
- operator workflow 与 publish gate
- runtime current mirror 与 scenario bundles
- stage docs 与 canonical reports
- 本地构建副产物与 IDE 痕迹

## Classification

### Baseline Source Of Truth

- `mobile/pages/*`
- `mobile/components/*`
- `mobile/services/*`
- `mobile/theme/*`
- `mobile/pages.json`
- `mobile/api/local-runtime-api.js`
- `scripts/import/*`
- `scripts/runtime/*`
- `scripts/tests/*`
- `scripts/ops/*`
- `scripts/bootstrap/*` 与 `scripts/contracts/*` 中新增/更新的 canonical validators and smokes
- `docs/STAGE_UI*`
- `docs/STAGE_DATA1*`
- `docs/STAGE_TEST1*`
- `docs/STAGE_OPS1*`
- `docs/STAGE_GIT1*`
- `docs/design-handoff/*`
- `data/real-content/*`
- `mobile/fixtures/runtime/scenarios/*`
- `mobile/fixtures/runtime/current/*`
- `ops/intake/.gitkeep`
- `ops/intake/manifests/*`

### Reproducible Generated Artifacts Worth Tracking

- `output/stage-ui3/*.json`
- `output/stage-data1a-pilot/*.json`
- `output/stage-data1b/*.json`
- `output/stage-data1c/*.json` except `extracted/`
- `output/stage-data1d/*.json`
- `output/stage-test1/*.json`
- `output/stage-ops1/*.json`
- `output/stage-ops1/operator-catalog.md`
- `output/stage-ui1_5/smoke-report.json`
- `output/stage-ui2/smoke-report.json`
- `output/stage-ui35-h5/*.json`

### Ephemeral Local Artifacts

- `mobile/unpackage/*`
- `mobile/.hbuilderx/*`
- `output/stage-data1c/extracted/*`
- `output/stage-data1a-pilot/extracted/*`
- `output/stage-data1b/extracted/*`
- `output/stage-data1b/temp-batch/*`
- `output/stage-ui35-h5/*.log`
- `output/stage-ui35-h5/*.png`
- `ops/intake/inbox/*.zip`
- `ops/intake/archive/*.zip`

### Ambiguous Or Needs Human Decision

- 历史阶段早已 tracked 的旧 `output/*` 目录，尤其是 `output/stage-h0_5-*`、`output/stage-e1-h5/*`、`output/pdf/*`。
- 这类历史产物本次不重写历史，也不做大规模 purge；后续如要清库，应单独开 stage。

## Stage Coverage In This Baseline

- UI2 / UI3 / UI3.5 partial closeout artifacts
- DATA1A / DATA1B / DATA1C / DATA1D
- TEST1
- OPS1
