# Stage OPS1 Publish Gate Model

## Inputs

- `output/stage-data1d/metadata-quality-report.json`
- `output/stage-data1d/warning-report.json`
- `output/stage-data1d/override-report.json`
- `output/stage-test1/final-report.json`
- `output/stage-test1/content-contract-report.json`
- `output/stage-test1/parser-golden-report.json`
- `output/stage-test1/lifecycle-report.json`
- `output/stage-test1/app-regression-report.json`
- scenario registry / selected pointer / current mirror

## Blockers

- scenario 不存在
- scenario 已 retired
- selected/current 状态不一致且无法修复
- TEST1 final 失败
- content contract 失败
- parser golden 失败
- lifecycle 失败
- app regression 失败

## Warnings

- Reader's Digest `ordinal` best-effort 缺口
- 已登记的 Economist anomaly / fallback warning

## Publish Policy

- blocker 永远不能被 `force` 覆盖
- warnings 需要显式 `--force-with-warning`
- publish / rollback / retire 必须写 history
