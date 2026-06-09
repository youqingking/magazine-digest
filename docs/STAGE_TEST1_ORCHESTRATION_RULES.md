# Stage TEST1 Orchestration Rules

## Serial Only

- importer
- parser golden
- lifecycle
- app regression

全部串行执行，禁止并发触碰：

- `output/stage-data1c/extracted`
- `mobile/fixtures/runtime/current/*`
- `mobile/fixtures/runtime/scenarios/index.json`
- `mobile/fixtures/runtime/scenarios/selected.json`

## Baseline Restore

- TEST1 开始前记录 baseline selected scenario
- lifecycle 与 app regression 测试结束后必须恢复 baseline
- 若恢复失败，视为 blocker

## Report Discipline

- 每层测试都必须写独立 report
- `final-report.json` 只汇总，不替代子报告
