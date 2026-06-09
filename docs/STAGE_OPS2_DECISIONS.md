# Stage OPS2 Decisions

## Scope

- 在现有 DATA1D lifecycle、OPS1 gate、TEST1 regression、RC1 manual closeout 之上，补齐 `scenario diff + promotion decision + operator pipeline`。
- 保持现有 parser / override / publications / issues / scenario registry / selected / current mirror 架构不变。
- 默认只提供 repo-local、非破坏性的候选发布流程，不扩张为 full backend/admin。

## Confirmed Foundations Kept Intact

- 7 个正式页面 IA 冻结，不重开。
- `detail` 仍是唯一阅读页，默认 `quick_30s`，顶部切 `deep_3m`。
- Stage G、H0、H1a foundation 不改。
- RC1 manual runtime closeout 继续独立存在，不混入自动 promotion gate。

## OPS2 Gap Audit

当前已具备：

- named scenario bundles + registry
- `selected` pointer 与 `current` mirror 分离
- `select / publish / rollback / retire`
- TEST1 串行回归
- OPS1 publish gate
- operator catalog / publish history

当前仍缺：

1. candidate 与 `baseline/current/selected` 的结构化 diff
2. mixed preview 与 single-publication baseline 的可读 compare
3. 将 diff、gate、lifecycle、quality、warnings、overrides、TEST1 汇总成单一 promotion decision
4. 一条 operator 可直接执行的 inspect -> compare -> gate -> evaluate -> dry-run publish -> apply publish -> rollback 流程
5. 面向 operator 的 promotion dashboard / summary / history

## State Model

- `baseline`
  - 已知稳定、可回退目标的 scenario
  - 不能被静默覆盖
- `current`
  - 当前 runtime mirror 对应的已发布 scenario
  - 只能由 publish / rollback 显式更新
- `selected`
  - 当前 operator 选中的待发布目标
  - 只改变指针，不自动更新 `current`
- `candidate`
  - 本次 inspect / compare / evaluate / promote 的目标 scenario
  - 通常等于命令行 `--scenario`，若未传则可回退到 `selected`
- `preview`
  - 尚未发布、通常用于 compare / dry-run 的 scenario
  - mixed preview 不得自动升为 `current`
- `retired`
  - registry 中保留但禁止 promotion / publish 的 scenario

## Promotion Decision Model

OPS2 决策输出固定为：

- `promotable`
- `hold_warning`
- `blocked`

判定来源必须同时看：

1. scenario existence / lifecycle state
2. scenario diff
3. metadata quality
4. warning taxonomy
5. override report
6. TEST1 final + subreports
7. current / selected / baseline integrity

## Safety Decisions

- publish 默认必须先经过 diff + gate + promotion evaluation。
- `--apply` 前默认只做 dry-run / evaluation。
- `--force-with-warning` 只能跨过 warning，不能跨过 blocker。
- baseline / current 不允许静默覆盖。
- operator 不需要手改 registry / selected / current json。
- 所有命令都必须落盘 machine-readable 和 human-readable 报告。

## Non-goals

- 不做 full CMS / admin
- 不做复杂审核流 / RBAC
- 不做 GitHub 集成
- 不做人工 runtime closeout 自动化替代
- 不重写 schema / backend contracts
