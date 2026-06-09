# Stage DATA1D Test Plan

## Coverage

1. Reader's Digest pilot 入口继续可用。
2. Three-release pack 在 parser + override 后可稳定重导入。
3. `the_atlantic` 与 `the_economist` 的质量指标有量化改善。
4. quality / warning / override 报告生成正常。
5. selected / publish / rollback 工具可执行且可回退到 baseline。
6. feed / search / detail / paywall / profile 关键路径不回归。

## Required Reports

- `output/stage-data1d/metadata-quality-report.json`
- `output/stage-data1d/warning-report.json`
- `output/stage-data1d/override-report.json`
- `output/stage-data1d/publish-flow-report.json`
- `output/stage-data1d/smoke-report.json`
