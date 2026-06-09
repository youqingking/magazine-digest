# Stage OBS1 Test Plan

## Goals

- 验证 release-aware event schema 已落地。
- 验证 local sink、summary report、triage dashboard 可生成且可读。
- 验证 app/runtime/ops/channel 关键路径至少产生一轮结构化事件。
- 验证 TEST1 / OPS2 / DATA2 / OPS3 / TEST2 / OPS4 / REL1 不回归。

## Core OBS1 Checks

1. baseline runtime source 可生成 `runtime_source_loaded` / source health。
2. `scenario_preview:data1c_three_release_mixed_preview` 可生成 source switch 事件。
3. `channel_head:dev` 可生成 channel / release 相关事件。
4. 故意访问缺失 scenario / invalid channel head 时，产生结构化 error event。
5. `build-release-artifact` / `publish-channel` / `rollback-channel` / `evaluate-promotion` 均产生对应 event。
6. `triage-dashboard.json` 可直接回答 current source / recent failures / recent publish health。
7. settings dev-only 与 operator console 都能读取 observability summary。

## Required Outputs

- `output/stage-obs1/runtime-events-report.json`
- `output/stage-obs1/incident-summary.json`
- `output/stage-obs1/source-health-report.json`
- `output/stage-obs1/channel-health-report.json`
- `output/stage-obs1/content-health-report.json`
- `output/stage-obs1/triage-dashboard.json`
- `output/stage-obs1/error-taxonomy-report.json`
- `output/stage-obs1/smoke-report.json`

## Execution Sequence

1. 运行既有 TEST1 / validators / stage smokes。
2. 执行 runtime source baseline / preview / channel 切换。
3. 执行 release artifact build / publish / rollback。
4. 执行 OBS1 smoke。
5. 检查 reports、console、settings dev-only summary。

## Pass Criteria

- required outputs 全部存在
- OBS1 smoke `passed`
- required stage smokes 无回归
- baseline 恢复成功
