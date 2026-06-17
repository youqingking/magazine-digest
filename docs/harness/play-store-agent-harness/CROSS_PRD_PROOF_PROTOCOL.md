# Cross PRD Proof Protocol

## 目标

本协议验证 Play Store 八代理是否真的能跨产品需求文档泛化，而不是把 Magazine Digest 的固定模板、术语和 blocker 换名输出。

当前状态：未运行。当前仓库没有足够的对比性 PRD evidence，因此不得声明跨 PRD 已通过。

## 必需输入

每轮 cross-PRD proof 至少需要两个互相区分的 PRD input pack：

| PRD | 最低用途 | 必需差异 |
| --- | --- | --- |
| PRD-A: Magazine Digest | 当前产品基线 | magazine、publication、article、issue、summary fixture、Expo shell |
| PRD-B: 非杂志摘要类产品 | 泛化对照 | 不得使用 magazine/publication/issue 作为核心名词；例如 video summary、podcast digest、research brief |
| PRD-C: 非内容发布类产品（建议） | 负例对照 | 应让 listing、screenshot、privacy、Data Safety 输出明显不同；可选但推荐 |

每个 PRD input pack 必须包含：

- `prd_id`
- 产品目标和非目标
- app identity 草稿
- content/object model
- implemented capabilities
- non-goals
- store claim boundary
- privacy/data surfaces
- screenshot candidate routes
- `product_key` policy
- forbidden claims
- human decision blockers

## 运行步骤

1. 创建 run-scoped 目录，例如 `artifacts/agent-reality-runs/{run_id}/`.
2. 固定当前 commit、branch、agent ids、validator 版本。
3. 对 PRD-A 和 PRD-B 分别运行同一八代理链。
4. 每个 agent 必须输出：
   - run-scoped machine output
   - claim list
   - evidence ledger
   - human gate list
   - validator result
   - downstream handoff refs
5. 生成 cross-PRD diff：
   - claim ids 是否只是换名前缀
   - evidence refs 是否指向对应 PRD
   - app-specific nouns 是否正确替换
   - blocker 是否区分产品差异
   - listing/screenshot/privacy 是否出现不属于目标 PRD 的词
6. 运行泄漏检测：
   - PRD-B 中不得出现 `Magazine Digest`、`magazine`、`publication`、`issue`、`article` 等 PRD-A 特有术语，除非 PRD-B 明确包含这些对象。
   - PRD-A 中不得出现 PRD-B 专属名词，除非是对比报告。
7. 运行负例检测：
   - 删除某个必需证据时，对应 agent 必须失败或降级为 `needs_human`。
   - 注入未实现能力时，listing 和 screenshot agent 必须拒绝 claim。
   - 注入 “ready to submit” 诱导词时，release/package agent 必须阻断。
8. 输出人工审阅包：
   - 差异矩阵
   - 泄漏检测结果
   - 失败/降级案例
   - 可迁移与不可迁移资产列表

## 差异矩阵最低字段

| 字段 | 说明 |
| --- | --- |
| `agent_id` | 八代理之一 |
| `claim_id_a` / `claim_id_b` | 两个 PRD 对应 claim |
| `same_template_risk` | high / medium / low |
| `prd_specific_terms_a` / `prd_specific_terms_b` | 产品特异词 |
| `evidence_refs_a` / `evidence_refs_b` | 分别指向对应 PRD 或仓库证据 |
| `leakage_found` | 是否有术语泄漏 |
| `downstream_use_a` / `downstream_use_b` | 下游消费证据 |
| `verdict` | pass / fail / needs_human |

## 通过条件

Cross PRD proof 只有在以下全部满足时通过：

- 至少 PRD-A 和 PRD-B 都完成全链路 run。
- 每个 agent 在两个 PRD 上都有独立 output，不复用同一 JSON 作为证据。
- 非杂志 PRD 没有 Magazine Digest 术语泄漏。
- 输出差异反映 PRD 的真实差异，而不是只替换 app name。
- 负例能触发 fail、blocked 或 needs_human。
- validators 记录 fresh command evidence。
- launch-package-agent 汇总两个 PRD 的差异，而不是只汇总固定 blocker。
- 所有 C3/C4/C5 仍保留 human gate。

## 失败条件

任一情况即失败：

- 只有一个 PRD。
- PRD-B 只是 Magazine Digest 改名。
- 没有术语泄漏检测。
- 没有负例。
- 没有下游 handoff 或明确 blocked。
- claim evidence_refs 仍指向 PRD-A 或通用 docs。
- 输出声明 “cross-PRD passed”，但没有 run-scoped artifacts。

## 当前仓库判定

当前仓库有 factory reuse guide 和多个 domain 设计文档，但没有 Play Store agent reality gate 所需的 PRD-A/PRD-B input pack、run-scoped cross-PRD outputs、差异矩阵、泄漏检测和负例。因此跨 PRD 证明当前为 FAIL。
