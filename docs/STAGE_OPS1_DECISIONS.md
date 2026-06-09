# Stage OPS1 Decisions

## Scope

- 建立 repo-local intake inbox
- 建立 operator-facing catalog / dashboard 产物
- 将 TEST1 与质量报告接入 publish gate
- 提供统一、可机读也可人读的 ops commands

## Workflow Boundary

- 自动 gate 只覆盖数据质量、scenario 生命周期与 app deterministic regression
- UI3.5 manual runtime closeout 继续保留为独立 human checklist
- publish gate 不接受 blocker override

## Safety Decisions

- baseline scenario 不得静默覆盖
- publish 默认先跑 gate
- 有 warning 时必须显式 `--force-with-warning`
- importer、gate、publish、rollback 全部串行执行
