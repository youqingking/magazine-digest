# Agno Real Run Standard

## 目标

本标准区分“Agno 包或 Workflow 被调用过”和“Agno 代理真实完成了可验证任务”。二者不能混用。

当前 Agno 分类：A2 deterministic workflow wrapper。

当前仓库可以证明 `agno.workflow.Workflow` 被本地 runner 调用过，并生成了 L3 run artifacts；但不能证明 Agno Agent/Team/model-backed reasoning 已经验证八代理现实性或跨 PRD 泛化。

## Agno 运行等级

| Level | 名称 | 最低证据 | 当前是否满足 |
| --- | --- | --- | --- |
| A0 | docs only | 只有 workflow 文档 | 已超过 |
| A1 | dry-run artifact | 手写或本地生成 dry_run_only step artifact | 已满足历史 M2/M4 |
| A2 | deterministic workflow wrapper | `agno.workflow.Workflow` 调用本地函数；函数读取既有文件、跑 validator、写 artifacts | 当前满足 |
| A3 | model-backed agent step | Agno Agent/Team 使用声明的模型、工具和输入，生成或评审 step output，并写可复验 artifact | 未满足 |
| A4 | cross-PRD agent replay | A3 在至少两个 PRD 和负例上重复运行，通过泄漏检测和差异矩阵 | 未满足 |
| A5 | external production action | Play Console、真实账号、发布或凭据动作 | 本仓库禁止 |

## A2 可声明内容

A2 只能声明：

- Agno package version 被 pin 并可 import。
- `Workflow` run 完成。
- 本地 adapter 顺序执行。
- validator command 被执行并记录 exit code。
- run.json 和 step artifacts 被写出。

A2 不能声明：

- Agno agent 已理解 PRD。
- Agno agent 已生成真实内容判断。
- Agno 证明跨 PRD 泛化。
- Agno 证明 Play Store readiness。
- Agno 证明旧代理输出可以安全强化。

## A3 必需证据

达到 A3 需要新增 run-scoped evidence，且不能暴露真实凭据：

- `agent_id` 与 Agno Agent/Team 配置。
- model/provider 标识和安全的配置摘要；不得写真实 API key。
- input digest：PRD、repo evidence、skill、harness contract 的 hash 或摘要。
- tool list：允许工具、禁止工具、实际 tool call summary。
- step decision summary：为什么生成/阻断某个 claim；只写可审计摘要，不写隐藏推理链。
- output diff：本轮生成或评审前后的差异。
- validator result：fresh command、exit code、stdout/stderr digest。
- replay command：同一输入可复跑。
- failure mode：缺证据、缺 human gate、术语泄漏、未实现能力 claim 时必须失败。

## A4 必需证据

A4 必须在 A3 之上增加：

- PRD-A 与 PRD-B 的独立 input pack。
- 两个 PRD 的独立 run ids。
- 术语泄漏检测。
- 负例注入。
- claim 差异矩阵。
- human reviewer 或 Pro reviewer 复核记录。

## 当前仓库 Agno 证据评估

已满足：

- `docs/agno/requirements-agno.txt` 存在 `agno==2.6.12`。
- `scripts/agent_tools/run_play_store_agno_workflow.py` 调用 `Workflow(`。
- `artifacts/agno/play-store/l3/*/run.json` 显示 `RunStatus.completed`。
- step artifacts 记录 validator command、exit code、runtime provenance。

未满足：

- 没有 Agno Agent/Team/model-backed step。
- 没有 model/provider 配置摘要。
- 没有 prompt/input digest。
- 没有 tool-call trace。
- 没有跨 PRD replay。
- 没有负例证明。
- 没有把 deterministic adapter 与 agent reasoning 区分到所有输出 claim 中。

## 禁止性表述

以下表述在 A2 阶段禁止使用：

- 禁止：“Agno 已证明八代理真实可靠”
- 禁止：“Agno L3 证明可泛化”
- 禁止：“real_run 表示 agent reasoning 已完成”
- 禁止：“Workflow completed 表示 Play Store agent 完成”
- 禁止：“可以安全强化代理输出”

允许表述：

- “Agno Workflow 包装的 deterministic adapter run 已完成”
- “本地 validator 在该 run 中执行并通过”
- “该 run 仍不能证明 model-backed agent reasoning 或 cross-PRD 泛化”

## 现实性通过标准

Agno reality gate 只有在 A3 与 cross-PRD protocol 同时通过时，才能把 Agno 证据用于强化代理输出。A2 只能作为 runner/provenance 证据，不能作为真实代理能力证据。
