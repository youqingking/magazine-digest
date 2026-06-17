# Play Store 代理现实性缺口审计

## 审计结论

当前结论：不可以安全强化代理输出。

现有八个 Play Store 代理已经有技能入口、草稿文档、机器可读 JSON、局部 validator、Agno Workflow 包装运行记录和 launch package 报告；但这些资产仍不能证明“真实杂志摘要输出充足”“跨 PRD 泛化可靠”或“Agno 代理真实推理有效”。它们最多证明：仓库内一组固定文件满足当前 schema、guardrail 词汇和 no-credential 边界。

本审计不删除既有资产，也不把现有 `pass` 结果改写为失败；它定义现实性缺口，并把后续可强化条件收紧到可复验、可对比、可下游消费的证据标准。

## 已审阅证据

- `AGENTS.md`
- `docs/NEED_HUMAN.md`
- `docs/factory/APP_FACTORY_PHASE_A_REUSE_GUIDE.md`
- `.agents/skills/*/SKILL.md`
- `docs/launch/**`
- `docs/privacy/**`
- `docs/release/**`
- `docs/agno/**`
- `docs/harness/play-store-agent-harness/**`
- `scripts/agent_tools/validate_*agent*.py`
- `scripts/agent_tools/run_play_store_agno_workflow.py`
- `scripts/agent_tools/play_store_agno_adapters.py`
- `evals/agents/*.eval.yaml`
- `artifacts/agno/play-store/l3/*/run.json`

## 关键发现

### 1. 哪些输出是通用的

以下输出主要是治理模板、阻断清单或字段形状检查，缺少足够的产品特异性：

| 输出区域 | 通用性表现 | 为什么不足 |
| --- | --- | --- |
| release/build | 反复列出 EAS、签名、Play Console、Android package blocker | 这是任何 Expo Play Store 项目都会有的发布前 blocker，不能证明当前 Magazine Digest release 真实可行 |
| privacy / Data Safety | 主要围绕 privacy policy URL、developer contact、SDK inventory、owner review | 缺少真实发布 artifact、真实 SDK tree、真实数据流和法律/隐私答复 |
| listing draft | 描述 fixture-backed discovery、article detail、draft listing field length | 文案可被迁移到多数摘要类应用，缺少真实杂志内容质量、授权和受众定位证据 |
| screenshot storyboard | 使用 `/`、`/article/[articleId]`、`/debug` 的规划性 shot-list | 没有真实截图、设备、viewport、商标/内容授权或视觉审核 |
| launch info | 收集 source-of-truth 缺口 | 大量字段是 `missing` / `needs_human`，不能证明 launch 信息已准备好 |
| launch package | 把七个或八个代理输出重新汇总为中文 readiness 报告 | 报告可读性提升了，但下游仍是 owner review，不是发布证据 |
| evals | 多数 eval 是 skeleton 或固定输入 | 不构成跨 PRD、负例或内容真实性评估 |
| Agno L3 artifacts | 记录 `agno.workflow.Workflow` 调用和本地 adapter 执行 | 主要证明 deterministic adapter 被包在 Agno Workflow 中运行，不证明 model-backed agent 推理 |

### 2. 哪些主张缺乏证据

| 主张 | 当前证据 | 缺口 |
| --- | --- | --- |
| “validators cover evidence-bound outputs” | JSON shape、required fields、forbidden terms、claim class、human gate 检查 | 没有逐 claim 校验 source path 的具体片段、命令 freshness、内容真实性或下游使用 |
| “Agno L3 real_run” | `run_play_store_agno_workflow.py` import `agno.workflow.Workflow`，L3 `run.json` 显示 `RunStatus.completed` | 未证明 Agno Agent/Team/model 生成或评估输出；没有 tool-call trace、prompt/input digest、模型配置或跨 PRD replay |
| “真实杂志摘要输出可支撑商店文案/截图” | listing 和 screenshot 文档引用 fixture-backed article surfaces | 没有真实杂志摘要包质量检查、摘要/正文一致性 gate、授权状态或可公开样张 |
| “No live service collection observed” | 当前 seam 和 local fixture docs | 这是静态仓库观察，不能替代 release artifact、SDK tree 或运行时网络观测 |
| “field lengths within limits” | listing JSON 字段长度 | 字段长度只证明格式，不证明文案真实、授权、合规或可提交 |
| “screenshot capture blocked is safe” | `adb devices` 或缺设备记录，`capture_status=blocked` | 阻断是诚实的，但不能被当作截图资产准备完成 |
| “8-agent readiness package owner-ready” | run-scoped或 legacy launch package 报告 | owner-readable 不是 owner-approved；缺少 owner review decision artifact |

### 3. 哪些验证者是浅层的

现有 validator 的价值是真实的，但验证深度不足以支持现实性完成：

| Validator | 已覆盖 | 浅层点 |
| --- | --- | --- |
| `validate_play_store_agent_harness.py` | 必需文件、协议字段、禁止词、插件规格 | 主要验证文档协议存在；不能证明协议被真实运行或 claim 绑定到具体证据 |
| `validate_play_store_agent_mvp.py` | 聚合八个子 validator，检查 required files、allowed paths、forbidden terms、secret patterns | 通过条件仍偏向文件存在、字段存在、状态词正确 |
| `validate_play_store_agno_l3.py` | 检查 Agno dependency pin、runner、run.json、step artifacts、validator exit code | 接受 deterministic adapter run；不要求 Agno Agent/Team/model-backed reasoning |
| `validate_release_build_agent.py` | release 文档、机器输出、命令声明、阻断状态 | 不复跑或证明历史 `npm ci/typecheck/smoke` evidence freshness；不要求 signed Android artifact |
| `validate_privacy_disclosure_prep.py` | inventory/docs/schema/human gate | 不校验 release artifact SDK tree、真实数据流或法律答复 |
| `validate_google_play_listing.py` | JSON parse、field length、draft/human gates | 不校验真实内容质量、授权、商店受众/分类决策 |
| `validate_screenshot_storyboard.py` | shot-list JSON、route allowlist、must_not_show、human gate | route allowlist 是硬编码/文档级；不验证 app 实际渲染和截图 |
| `validate_screenshot_capture_agent.py` | capture blocked shape、安全边界 | blocked 可通过，但不产生截图真实性证据 |

### 4. 哪些代理缺少下游使用

| Agent | 缺少的下游使用证明 |
| --- | --- |
| `release-build-agent` | 没有 EAS build、signed AAB/APK、Play internal track dry-run 或 release artifact ledger |
| `privacy-disclosure-prep` | 没有隐私/法律 owner decision，没有 release artifact SDK inventory 对照 |
| `google-play-listing` | 没有 Play Console draft import、owner copy review、商标/内容授权审核记录 |
| `screenshot-storyboard` | 没有真实截图捕获任务消费 shot-list，没有可公开资产选择记录 |
| `launch-info-collector` | 没有 owner 填充后的 store source-of-truth，没有 Play Console app/account decision |
| `google-data-safety-agent` | 没有 Play Console Data Safety answer mapping 或 owner/Pro 审核结果 |
| `screenshot-capture-agent` | 没有 raw PNG、设备信息、viewport、locale、commit 对应的截图文件 |
| `launch-package-agent` | 输出是 review package，未被 PR、owner review、release gate 或 Play submission workflow 消费并签收 |

### 5. Agno 是否实际运行过

结论：Agno package / Workflow 层面实际运行过；Agno 代理现实性层面未被证明。

已观察到：

- `scripts/agent_tools/run_play_store_agno_workflow.py` 引入 `from agno.workflow import Workflow`。
- `docs/agno/requirements-agno.txt` pin 到 `agno==2.6.12`。
- `artifacts/agno/play-store/l3/*/run.json` 存在多个 `schema_version=play_store_agno_l3_run.v1`、`agno_status=real_run`、`workflow_run_status=RunStatus.completed` 的 run。
- step artifacts 记录了 validator command、stdout/stderr ref、runtime provenance 和 blocker。

现实性限制：

- Workflow step 是本地函数，核心工作由 `play_store_agno_adapters.py` 顺序读取既有 JSON、生成 launch package、运行本地 validator。
- 未发现 Agno Agent/Team 级别的 model-backed generation、tool-call trace、prompt/input digest、模型配置、评审 rubric 或 cross-PRD replay。
- 现有文档存在状态漂移：`docs/agno/AGNO_RUNTIME_CHECK.md` 和部分 harness 文档仍保留 `dry_run_only` 叙事，而 L3 artifacts 与 validator 又接受 `real_run`。
- 因此不得把 “Agno Workflow completed” 写成 “Agno 代理已证明可泛化/可真实完成”。

### 6. 是否存在对比性的产品需求文档

结论：当前不存在足够的对比性 PRD 证据。

仓库里有 `docs/factory/APP_FACTORY_PHASE_A_REUSE_GUIDE.md`、共享域文档和 Magazine / YouTube / Podcast 等 domain 讨论，但这些不是 Play Store 代理 reality gate 的对比 PRD fixture。它们没有形成：

- 至少两个互相区分的 PRD 输入包。
- 每个 PRD 的 canonical app facts、content model、store claim boundary、negative claims。
- 同一八代理链在两个 PRD 上的输出差异矩阵。
- 防止 Magazine Digest 术语泄漏到非杂志 PRD 的自动检查。
- 人工评分或 machine rubric，证明输出不是把模板换名。

## 逐代理现实性摘要

| Agent | 当前现实性 | 主要缺口 |
| --- | --- | --- |
| `release-build-agent` | L2 schema 较完整，发布现实性不足 | 缺 signed Android build、EAS/Play owner、fresh command ledger |
| `privacy-disclosure-prep` | 草稿边界清楚，隐私现实性不足 | 缺 release SDK tree、真实数据流、owner/legal sign-off |
| `google-play-listing` | 字段和 guardrail 较好，文案现实性不足 | 缺真实内容质量、授权、owner copy review、跨 PRD 差异 |
| `screenshot-storyboard` | 规划输出存在，视觉现实性不足 | 缺真实渲染、截图、设备、公开资产审核 |
| `launch-info-collector` | 缺口收集有用，source-of-truth 不完整 | 缺 Play Console/account/package/EAS owner 输入 |
| `google-data-safety-agent` | Data Safety draft 结构存在，证据弱 | 缺 Play Console answer mapping、release artifact SDK review |
| `screenshot-capture-agent` | blocked 诚实，但不能当作资产完成 | 缺 raw screenshots、device/emulator、viewport/locale proof |
| `launch-package-agent` | 汇总可读，但容易被误读成完成 | 缺 owner sign-off、下游消费、现实性 pass gate |

## M0 阻断判断

Reality Gate 当前状态：FAIL。

不可安全强化代理输出，除非先满足以下条件：

1. 建立并运行 `CROSS_PRD_PROOF_PROTOCOL.md` 中的对比 PRD 证明。
2. 建立并运行 `AGNO_REAL_RUN_STANDARD.md` 中的真实 Agno 运行证据标准。
3. 每个代理输出都能在 `PER_AGENT_TRUTH_TABLE.md` 中从 “字段/模板存在” 升级为 “现实证据存在”。
4. 至少一个真实 Magazine Digest 摘要 fixture 通过摘要/正文一致性、可读性、授权状态和公开使用边界检查。
5. 下游消费必须有独立证据：PR review、owner decision、Play Console draft import、真实 screenshot capture、release artifact 或明确的 blocked artifact。
