# Stage TEST2 Isolation Model

## Read-only

- harness verify
- contract validators
- inspect scenario when only读取 registry / bundle

## Report-only

- `compare-scenarios`
- `evaluate-promotion`
- `run-gate --use-existing-reports`

这些脚本可写 sandbox report，但不应在并行执行时直写 canonical report。

## Stateful

- `run-test1`
- `import-content-pack`
- `promote-scenario --apply`
- `rollback-scenario`
- `apply-promotion-drill`
- `smoke-stage-test1/ops2/data2/ops3`

## Sandbox Rule

- 每次 orchestration run 都创建 `output/runs/<run-id>/`
- 中间 report / extracted / suite logs 优先写 sandbox
- 只有 finalize step 才更新 canonical output
