# PLAY_STORE_AGENT_REGISTRY

## Purpose

本 registry 定义首批 Play Store App Factory agents。它是 repo 管理层文档和本地 Skill 入口，不修改 app behavior、package scripts、dependencies、production config、applied migrations、Supabase、RevenueCat、Push 或 Google Play 状态。

当前 M4 目标是让 8-agent Play Store launch-prep workflow 都以 `dry_run_only` 方式达到 `L2` evidence-bound output。每个 policy、legal、privacy、trademark、submission 结论继续保留 `human review required`。

## Current App Facts

| Fact | Evidence |
| --- | --- |
| 主壳是 Expo + React Native + TypeScript + Expo Router。 | `README.md`, `apps/mobile/package.json` |
| 当前 runtime 默认读取 local fixture。 | `apps/mobile/README.md`, `docs/mobile/MOBILE_RUNTIME_SHELL.md` |
| 已存在 routes：`/`, `/article/[articleId]`, `/debug`。 | `apps/mobile/app/**` |
| Supabase、RevenueCat、Push 只是 seam / placeholder，不是 live service。 | `packages/core-runtime/src/seams/**`, `docs/mobile/MOBILE_RUNTIME_SHELL.md` |
| `product_key` 必须作为关键维度保留。 | `AGENTS.md`, `docs/architecture/**`, `docs/runtime/**` |

## Agents

| Agent | Skill | Primary Output | Validator | Submission Status |
| --- | --- | --- | --- | --- |
| `release-build-agent` | `.agents/skills/release-build-agent/SKILL.md` | `docs/launch/release/PLAY_STORE_RELEASE_GATE.md` | `python scripts/agent_tools/validate_release_build_agent.py .` | `dry-run` only |
| `privacy-disclosure-prep` | `.agents/skills/privacy-disclosure-prep/SKILL.md` | `docs/launch/privacy/human-review-required.md`, `docs/launch/google-play/data-safety-draft.md` | `python scripts/agent_tools/validate_privacy_disclosure_prep.py .` | `human review required` |
| `google-play-listing` | `.agents/skills/google-play-listing/SKILL.md` | `docs/launch/google-play/listing.*.json` | `python scripts/agent_tools/validate_google_play_listing.py .` | `draft` only |
| `screenshot-storyboard` | `.agents/skills/screenshot-storyboard/SKILL.md` | `docs/launch/screenshots/storyboard.md` | `python scripts/agent_tools/validate_screenshot_storyboard.py .` | `draft` only |
| `launch-info-collector` | `.agents/skills/launch-info-collector/SKILL.md` | `docs/launch/LAUNCH_INFO.md`, `docs/launch/store-fields/source-of-truth.json` | `python scripts/agent_tools/validate_launch_info_collector.py` | `human review required` |
| `google-data-safety-agent` | `.agents/skills/google-data-safety-agent/SKILL.md` | `docs/launch/google-play/data-safety-draft.md`, `docs/launch/google-play/data-safety-evidence.md` | `python scripts/agent_tools/validate_google_data_safety_agent.py` | `evidence draft` |
| `screenshot-capture-agent` | `.agents/skills/screenshot-capture-agent/SKILL.md` | `docs/launch/screenshots/capture-report.md`, `docs/launch/screenshots/capture-blockers.md` | `python scripts/agent_tools/validate_screenshot_capture_agent.py` | `blocked` |
| `launch-package-agent` | `.agents/skills/launch-package-agent/SKILL.md` | `artifacts/launch-package/manifest.json`, `artifacts/launch-package/readiness-report.md` | `python scripts/agent_tools/validate_launch_package_agent.py` | `RED` readiness |

## M2 Harness Maturity

| Agent | Before M2 | After M2 | Machine-readable output | Agno step artifact | Human gate |
| --- | --- | --- | --- | --- | --- |
| `release-build-agent` | `L1` | `L2` | `docs/release/release-build-agent-output.json` | `artifacts/agno/play-store/m2/release-build-agent.json` | Android build, signing, EAS, Play Console |
| `privacy-disclosure-prep` | `L1` | `L2` | `docs/privacy/privacy-disclosure-prep-output.json` | `artifacts/agno/play-store/m2/privacy-disclosure-prep.json` | Privacy policy, Developer contact, Data Safety, SDK disclosure |
| `google-play-listing` | `L1` | `L2` | `docs/launch/google-play/google-play-listing-agent-output.json` | `artifacts/agno/play-store/m2/google-play-listing.json` | listing copy, category, rating, target audience, Play Console |
| `screenshot-storyboard` | `L1` | `L2` | `docs/launch/screenshots/screenshot-storyboard-agent-output.json` | `artifacts/agno/play-store/m2/screenshot-storyboard.json` | capture, image spec, content authorization, public use |

M2 结束时后四个 agents 仍是 `L0/planned`；M4 已将它们提升到 `L2` evidence-bound output，但仍保持 `dry_run_only`，没有真实 Play Console、credentials、submission 或 L3 runtime adoption。

## M4 Harness Maturity

| Agent | Before M4 | After M4 | Machine-readable output | Agno step artifact | Human gate |
| --- | --- | --- | --- | --- | --- |
| `launch-info-collector` | `L0` | `L2` | `docs/launch/launch-info-collector-output.json` | `artifacts/agno/play-store/m4/launch-info-collector.json` | Play Console, Android package, EAS, store fields |
| `google-data-safety-agent` | `L0` | `L2` | `docs/launch/google-play/google-data-safety-agent-output.json` | `artifacts/agno/play-store/m4/google-data-safety-agent.json` | Data Safety, SDK disclosure, privacy/legal review |
| `screenshot-capture-agent` | `L0` | `L2` | `docs/launch/screenshots/screenshot-capture-agent-output.json` | `artifacts/agno/play-store/m4/screenshot-capture-agent.json` | device/emulator, image spec, public asset review |
| `launch-package-agent` | `L0` | `L2` | `artifacts/launch-package/launch-package-agent-output.json` | `artifacts/agno/play-store/m4/launch-package-agent.json` | owner/Pro launch package review |

8-agent readiness package: `artifacts/launch-package/manifest.json`，当前 readiness 为 `RED`。

## Release Gate Path

`docs/launch/release/PLAY_STORE_RELEASE_GATE.md` is intentional for this MVP and is the canonical Play Store release gate path. `docs/release/PLAY_STORE_RELEASE_DRY_RUN.md` is a supporting dry-run command note, not the canonical Play Store gate.

## Aggregate Validator

```powershell
python scripts/agent_tools/validate_play_store_agent_mvp.py .
```

## Allowed Paths

本 agent layer 只允许触碰：

- `.agents/skills/release-build-agent/**`
- `.agents/skills/privacy-disclosure-prep/**`
- `.agents/skills/google-play-listing/**`
- `.agents/skills/screenshot-storyboard/**`
- `.agents/skills/launch-info-collector/**`
- `.agents/skills/google-data-safety-agent/**`
- `.agents/skills/screenshot-capture-agent/**`
- `.agents/skills/launch-package-agent/**`
- `docs/agents/**`
- `docs/launch/**`
- `docs/privacy/**`
- `docs/release/**`
- `docs/agno/**`
- `docs/harness/play-store-agent-harness/**`
- `artifacts/agno/**`
- `artifacts/launch-package/**`
- `artifacts/screenshots/**`
- `scripts/agent_tools/**`
- `evals/agents/**`
- `codex_prompts/**`

`docs/NEED_HUMAN.md` 只允许作为 repo 指令要求的 blocker ledger 更新，不允许把 blocker 改成 resolved，除非有人工证据。

## Hard Boundaries

- 不提交到 Google Play。
- 不添加真实 Supabase / RevenueCat / Push / Play Console credentials。
- 不修改 `package.json`、lockfiles、app source behavior、fixture source data、applied migrations 或 production config。
- 不虚构已实现功能。
- 不声称 privacy/Data safety/listing/release gate 已完成最终合规、发布批准或可提交。
- 不展示不可用功能在 screenshots 中。

## Handoff Order

1. `release-build-agent`：建立 build readiness 和 no-submit gate。
2. `privacy-disclosure-prep`：建立 data inventory、SDK inventory、privacy human-review gate、Data safety draft 与 evidence。
3. `google-play-listing`：从 source-of-truth 生成 listing draft 并检查字段长度。
4. `screenshot-storyboard`：规划只展示已实现 surface 的 shot-list。
5. `launch-info-collector`：收集 Play Store source-of-truth。
6. `google-data-safety-agent`：生成 Data Safety evidence draft。
7. `screenshot-capture-agent`：尝试真实捕获或明确 blocked。
8. `launch-package-agent`：汇总 8-agent readiness package。

## Human Review Required

以下结论不得由 agent 单独完成：

- Google Play developer account、app creation、track、country/region、category、content rating。
- Android package、EAS owner、projectId、signing key、service account、release track。
- Privacy policy URL、Data safety、legal basis、children/family policy、ads/tracking、third-party SDK disclosure。
- 商标、内容授权、出版物名称、截图素材、营销 claim。
- Play Store submission、rollout、production release。
