# Play Store Agent MVP

## Goal

落地最小可审查的 Play Store App Factory agent layer。这个 MVP 不做提交、不接凭据、不改 runtime，只让 repo 具备 8-agent 可复用 Skill、对应文档、validator、eval skeleton 和 Agno-ready workflow。

## Non-Goals

- 不创建 Google Play app。
- 不运行 `eas build` 或 `eas submit` 作为真实发布。
- 不接入 Supabase、RevenueCat、push notification、analytics、account/auth 或 payment SDK。
- 不生成最终 screenshot 图片。
- 不把 privacy、legal、trademark、Data safety、Play listing、screenshot、release 或 Play Store submission 判断写成 approval、final compliance、ready to submit 或 submission ready。
- 不在仓库内实现 `PDF / web / prompt -> markdown` 内容生产流水线。

## Intentional Release Gate Path

本 MVP 保留 `docs/launch/release/PLAY_STORE_RELEASE_GATE.md` 作为 canonical release gate path。理由：

- 本阶段是 Play Store launch preparation agent layer，release gate 属于 `docs/launch/**` launch readiness 包。
- `docs/release/PLAY_STORE_RELEASE_DRY_RUN.md` 只记录 repo 命令 dry-run policy，不作为 canonical Play Store gate。
- Registry、`release-build-agent` Skill、Agno docs 和 validators 均同步引用 `docs/launch/release/PLAY_STORE_RELEASE_GATE.md`。

## Minimum Readiness Definition

MVP readiness 只表示：

1. 8-agent `.agents/skills/*/SKILL.md` 存在，且每个都包含 required inputs、expected outputs、do/do not rules、validation steps、final report format、human approval points。
2. Launch docs 有单一 source-of-truth，listing、Data safety、screenshot 和 release readiness 都保持 draft/evidence/readiness/human-review-required。
3. `docs/privacy/DATA_INVENTORY.md` 和 `docs/privacy/SDK_INVENTORY.md` 存在并标记人工审核点。
4. Screenshot storyboard 不展示未实现功能。
5. Release gate 明确 Google Play submission out of scope。
6. Agno workflow 可以按 dry-run 顺序读取文件、运行 validator、输出 blocker report。

## Evidence Policy

所有 evidence 必须来自仓库文件、命令输出或人工提供的明确资料。Agent 不得把猜测写成事实。缺少 evidence 时使用：

- `draft`
- `unknown`
- `NEED_HUMAN`
- `human review required`
- `blocked`

## Validator Matrix

| Validator | Scope |
| --- | --- |
| `validate_release_build_agent.py` | Release build dry-run gate、submission 边界、release docs。 |
| `validate_privacy_disclosure_prep.py` | Data inventory、SDK inventory、Data safety draft、privacy review、evidence 和 human review markers。 |
| `validate_google_play_listing.py` | Source-of-truth、localized listing JSON、field length、claim guardrails。 |
| `validate_screenshot_storyboard.py` | Storyboard、shot-list JSON、screenshot validation notes、不可用功能防护。 |
| `validate_launch_info_collector.py` | Launch source-of-truth、field status、missing/human review gates。 |
| `validate_google_data_safety_agent.py` | Data Safety evidence draft、C3/C4 human gates。 |
| `validate_screenshot_capture_agent.py` | Capture report/blockers、capture_status、raw screenshot guardrails。 |
| `validate_launch_package_agent.py` | 8-agent readiness package、manifest、RED/YELLOW/GREEN readiness。 |
| `validate_play_store_agent_mvp.py` | 汇总检查 required files、allowed paths、no credentials、forbidden wording 和 8-agent validator 条件。 |

## Final Report Shape

每次使用这些 agents 后，Final Update 必须中文为主、英文为辅，并列出：

- changed files
- validation results
- generated outputs touched/restored
- unresolved `NEED_HUMAN`
- blocker summary
- milestone summary
- PR title/body recommendation
- Agno 是否可以 dry-run workflow

## Human Review Required

Google Play account、Android package、EAS signing、privacy policy、Data safety、listing claims、screenshots、content rating、trademark、submission 和 rollout 都必须人工审核；本 MVP 不提供发布批准。
