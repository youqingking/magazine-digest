# Stage GIT1 Commit Plan

## Commit Intent

创建一个 consolidated baseline commit，诚实表达当前仓库已经跨多个 stage 合并推进后的状态。

## Include

- 当前实际运行所依赖的 mobile source
- parser / import / runtime / ops / tests / bootstrap scripts
- design handoff、stage docs、audit docs、decision docs
- `data/real-content/*` normalized records、raw source snapshots、overrides、registries
- `mobile/fixtures/runtime/scenarios/*`
- `mobile/fixtures/runtime/current/*`
- canonical stage reports:
  - `output/stage-ui3/*`
  - `output/stage-data1a-pilot/*`
  - `output/stage-data1b/*`
  - `output/stage-data1c/*.json`
  - `output/stage-data1d/*`
  - `output/stage-test1/*`
  - `output/stage-ops1/*`
  - `output/stage-ui1_5/smoke-report.json`
  - `output/stage-ui2/smoke-report.json`
  - `output/stage-ui35-h5/*.json`

## Exclude

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

## Proposed Commit Message

`baseline: consolidate ui3 + data1a-d + test1 + ops1`

## Proposed Annotated Tag

`baseline-ui3-data1d-test1-ops1`

## Tag Annotation Summary

- consolidated baseline after UI shell convergence, real-content pipeline, metadata refinement, deterministic regression harness, and operator publish gate
- not a reconstruction of per-stage historical tags
