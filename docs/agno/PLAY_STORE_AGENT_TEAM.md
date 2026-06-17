# PLAY_STORE_AGENT_TEAM

## Purpose

定义 Agno-ready Play Store agent team。这里的 Agno workflow 是本地 dry-run 编排说明，不连接 Play Console，不添加 credentials，不执行 submission。

## Team Members

| Agent | Skill | Role | Output |
| --- | --- | --- | --- |
| `release-build-agent` | `.agents/skills/release-build-agent/SKILL.md` | Release readiness 和 no-submit gate。 | `docs/launch/release/PLAY_STORE_RELEASE_GATE.md` |
| `privacy-disclosure-prep` | `.agents/skills/privacy-disclosure-prep/SKILL.md` | Data inventory、SDK inventory、Data safety draft 和 privacy evidence。 | `docs/privacy/**`, `docs/launch/google-play/data-safety-*.md` |
| `google-play-listing` | `.agents/skills/google-play-listing/SKILL.md` | Listing source-of-truth、localized metadata draft 和 validation report。 | `docs/launch/google-play/listing*.json`, `docs/launch/google-play/listing-validation-report.md` |
| `screenshot-storyboard` | `.agents/skills/screenshot-storyboard/SKILL.md` | Screenshot storyboard、shot-list 和 validation notes。 | `docs/launch/screenshots/**` |

## Release Gate Path

The canonical release gate for this MVP is `docs/launch/release/PLAY_STORE_RELEASE_GATE.md`. This is intentional because the gate is part of the Play Store launch readiness package.

## Shared Context

每个 agent 必须读取：

- `AGENTS.md`
- `docs/NEED_HUMAN.md`
- `docs/factory/APP_FACTORY_PHASE_A_REUSE_GUIDE.md`
- `docs/agents/PLAY_STORE_AGENT_REGISTRY.md`
- `docs/launch/LAUNCH_INFO.md`
- `docs/launch/store-fields/source-of-truth.json`

## Shared Rules

- 中文为主、英文为辅。
- 不提交 Google Play。
- 不添加真实 Supabase / RevenueCat / Push / Play Console credentials。
- 不修改 app source behavior、package manifests、lockfiles、applied migrations、production config、fixture source data。
- 不虚构已实现功能。
- 法律、隐私、商标、Data safety、content rating、target audience、listing claim、screenshot asset、submission 结论全部 `human review required`。
- 所有关键数据、配置和事件设计必须支持 `product_key`。

## Handoff Contract

每个 agent 输出：

```yaml
agent: <agent-name>
status: pass | fail | blocked | tool_missing | environment_blocked | NEED_HUMAN
changed_files:
  - <path>
evidence:
  - <path-or-command>
human_review_required:
  - <item>
next_agent_context:
  - <short note>
```

## Dry-Run Validators

```powershell
python scripts/agent_tools/validate_release_build_agent.py .
python scripts/agent_tools/validate_privacy_disclosure_prep.py .
python scripts/agent_tools/validate_google_play_listing.py .
python scripts/agent_tools/validate_screenshot_storyboard.py .
python scripts/agent_tools/validate_play_store_agent_mvp.py .
```

## Human Escalation

Agno 必须在以下场景停止自动推进：

- 需要 Google Play、EAS、Supabase、RevenueCat、Push、legal/privacy/trademark 账号或凭据。
- 需要 Play Store submission、rollout 或 production release。
- 需要判断 Data safety 是否可用于 Play Console。
- 需要展示或声明当前 app 不具备的功能。
- 同类 validator 错误连续 3 次失败。
