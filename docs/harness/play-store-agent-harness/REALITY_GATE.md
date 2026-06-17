# Play Store Agent Reality Gate

## 目标

Reality Gate 用来阻止 Play Store 代理把“文件生成完成”“validator 通过”“Agno Workflow 跑过”误写成现实完成。它要求代理输出必须同时满足证据绑定、内容真实性、跨 PRD 泛化、下游消费和人审边界。

Reality Gate 当前状态：FAIL。

当前状态失败不是因为旧资产没有价值，而是因为旧资产只能证明 schema 和 guardrail，不能证明真实杂志摘要、跨产品泛化或 Agno agent 推理。

核心禁令：禁止把字段存在当作现实完成。

## Reality Level

| Level | 名称 | 含义 | 是否允许声明完成 |
| --- | --- | --- | --- |
| R0 | unverified draft | 只有文档或草稿 | 否 |
| R1 | shape-valid | 文件存在、JSON 可解析、字段齐全 | 否 |
| R2 | evidence-bound | claim 有 evidence_refs、human gate、forbidden action guardrail | 否，只能声明 evidence draft |
| R3a | deterministic workflow run | 本地 runner 或 Agno Workflow 顺序执行 adapter 和 validator | 否，只能声明 deterministic run completed |
| R3b | model-backed agent run | Agno Agent/Team/model-backed step 生成或评审输出，并有输入、工具、结果和复验 artifact | 仍需 human gate |
| R4 | cross-PRD proven | 至少两个对比 PRD 通过差异化、负例和泄漏检测 | 可声明可迁移草稿能力 |
| R5 | production/human approved | 真实账号、凭据、release artifact、Play Console、法律/隐私/商标/owner 批准均有外部证据 | 仍不得由 repo-only agent 单独声明 |

当前八代理最高只能按输出分别归为 R2 或 R3a；不得声明 R4 或 R5。

## 硬性停止条件

任一条件触发时，Reality Gate 必须失败：

- 只检查 required files、字段、长度或 forbidden words，就声称代理现实完成。
- 把 `capture_status=blocked` 当作截图资产准备完成。
- 把 `RunStatus.completed` 当作 Agno agent reasoning 已被证明。
- 把 `human review required` blocker 包装成 owner approval。
- 把通用 Expo / Play Store blocker 当作 Magazine Digest 特异性证据。
- 没有真实杂志摘要样本，却声称商店文案、截图或 Data Safety 可公开使用。
- 没有对比性 PRD 运行，却声称 App Factory 泛化能力强。
- 没有下游消费记录，却声称 launch package 可执行或可发布。
- 修改应用源码、核心运行时、package.json、锁定文件、生产配置、真实凭据、已应用迁移或测试数据源来让代理输出看起来通过。

## 必需证据类型

每个非阻断 claim 必须至少绑定一种强证据：

| Evidence type | 最低要求 | 不足示例 |
| --- | --- | --- |
| repo file evidence | source path、字段/章节、内容摘要、限制说明 | 只写文件路径 |
| command evidence | command、cwd、exit code、timestamp、stdout/stderr digest、commit | 只在文档里写 “pass” |
| runtime evidence | route、fixture、product_key、render/capture proof、commit | 只列 route allowlist |
| content evidence | 真实杂志摘要样本、摘要/正文一致性、可读性、授权状态 | 只写 fixture-backed summary |
| human decision evidence | owner role、decision ref、scope、timestamp、仍未解决项 | 只写 human review required |
| downstream evidence | 被哪个后续 agent、PR、review、Play draft、screenshot capture 或 release artifact 消费 | 只生成 launch package |
| cross-PRD evidence | 至少两个 PRD input pack、输出差异矩阵、术语泄漏检测 | 只引用 factory reuse guide |
| Agno evidence | dependency pin、runner command、workflow trace、step input/output digest、model/tool provenance | 只有 `Workflow(` 字符串 |

## 真实杂志摘要最低标准

任何涉及 store listing、screenshot、Data Safety、content rights 或 public asset 的 claim，都不能只依赖“当前 app 有文章详情页”。必须至少有一个真实 Magazine Digest 样本包或 fixture 证明：

- `product_key` 明确且可追溯。
- 标题、摘要、正文、source/publication metadata 一致。
- 摘要不是占位文案、模板文案或过短片段。
- 摘要与正文或 `quick_30s` 内容没有明显串位。
- 内容授权、商标和公开使用状态明确；未知时必须 `needs_human`。
- 样本来源不是本轮生成的运行时输出。

## Generic Output 检测

输出命中以下模式时必须降级为 generic draft：

- 删除 app 名称后仍可直接用于另一个 Expo/Play Store 项目。
- 大部分 claim 都是 Play Console、EAS、privacy policy、developer contact、screenshot device 等通用 blocker。
- listing copy 不引用任何真实产品差异、目标用户或可证明的内容体验。
- screenshot shot-list 只列 route，不证明路由实际渲染和可公开画面。
- launch package 只重新汇总旧 blocker，没有新增现实证据。
- 非杂志 PRD 输出仍出现 magazine、publication、article、issue 等 Magazine Digest 特有词。

## Validator 深度要求

Reality Gate validator 不得只做存在性检查。最低要求：

- 校验所有六份 reality gate 文档存在。
- 校验八个 agent 都出现在 audit 和 truth table。
- 校验审计明确写出通用输出、缺乏证据、浅层验证、缺少下游使用、Agno 实际运行状态、对比 PRD 是否存在。
- 校验当前结论是 FAIL，而不是 PASS。
- 校验 Agno 文档区分 deterministic workflow run 和 model-backed agent run。
- 校验 cross-PRD protocol 至少要求 PRD-A 与 PRD-B。
- 校验没有把当前资产声明为可安全强化。

## 通过条件

Reality Gate 只能在以下全部满足后通过：

1. `CROSS_PRD_PROOF_PROTOCOL.md` 定义的至少两个对比 PRD 都完成 run。
2. 每个 agent 在两个 PRD 上都有 run-scoped output、evidence ledger、validator result 和差异矩阵。
3. 非杂志 PRD 没有 Magazine Digest 术语泄漏，除非 PRD 明确需要。
4. 至少一个真实杂志摘要样本通过内容质量与授权边界检查。
5. Agno run 达到 `AGNO_REAL_RUN_STANDARD.md` 的 A3 或更高，且没有把 A2 deterministic wrapper 伪装为 agent reasoning。
6. 所有 C3/C4/C5 仍保持 human gate，除非有 owner/Pro decision artifact。
7. 下游消费证据存在，或明确写成 blocked 而非 complete。

## 当前 M0 决策

M0 决策：阻断强化。

可以做的下一步是增强 reality gate、补 cross-PRD harness、补真实 Agno 标准和真实内容证据；不可以把现有八代理输出直接升级为可靠、可泛化或可发布。
