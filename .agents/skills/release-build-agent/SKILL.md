---
name: release-build-agent
description: Prepare no-credential Play Store release build readiness docs and dry-run gates for the Expo-first mobile shell. Use when Codex is asked to assess Android release build readiness, EAS/Play Console prerequisites, release evidence, or Play Store submission gates without submitting to Google Play or adding credentials.
---

# release-build-agent

## Goal

维护 Play Store release build 的只读准备层（release readiness layer）。本 Skill 只整理 evidence、blockers、validator 结果和 dry-run gate，不运行真实 Google Play submission，不添加服务凭据，不修改 app behavior。

## Required Inputs

- `AGENTS.md`
- `docs/NEED_HUMAN.md`
- `docs/factory/APP_FACTORY_PHASE_A_REUSE_GUIDE.md`
- `README.md`
- `apps/mobile/README.md`
- `apps/mobile/app.json`
- `apps/mobile/package.json`
- `docs/launch/LAUNCH_INFO.md`
- `docs/launch/release/PLAY_STORE_RELEASE_GATE.md`
- `docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md`

## Expected Outputs

- `docs/launch/release/PLAY_STORE_RELEASE_GATE.md`
- `docs/release/PLAY_STORE_RELEASE_DRY_RUN.md`
- `docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md`
- `docs/agents/PLAY_STORE_AGENT_REGISTRY.md`
- `docs/agno/PLAY_STORE_LAUNCH_WORKFLOW.md`
- `evals/agents/release-build-agent.eval.yaml`

`docs/launch/release/PLAY_STORE_RELEASE_GATE.md` 是本 MVP 的 intentional release gate path，因为 launch preparation 文件统一放在 `docs/launch/**` 下；`docs/release/PLAY_STORE_RELEASE_DRY_RUN.md` 只保留命令 dry-run 说明。

## Do / Do Not Rules

Do:

- 收集 Expo runtime shell、EAS/Android identity、Play Console blocker 和 release dry-run evidence。
- 将 Android package、EAS owner/projectId、signing、Play Console app、release track 标记为 `NEED_HUMAN`，除非已有人工证据。
- 保留 `draft`、`readiness`、`evidence`、`human review required` 语义。

Do not:

- 不运行 `eas submit`、Google Play API submit、track rollout 或任何会提交到 Play Console 的命令。
- 不写入真实 keystore、service account、Supabase、RevenueCat、Push、Play Console credentials。
- 不修改 `package.json`、lockfiles、production config、applied migrations、fixture source data 或 app source behavior。
- 不把 release readiness 写成发布批准、policy approval、final compliance 或 submission ready。

## Harness Contract

This skill must follow the Play Store Agent Harness common substrate:

- `docs/harness/play-store-agent-harness/INPUT_CONTRACT.md`
- `docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md`
- `docs/harness/play-store-agent-harness/EVIDENCE_LEDGER.md`
- `docs/harness/play-store-agent-harness/CLAIM_CLASSIFICATION.md`
- `docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md`
- `docs/harness/play-store-agent-harness/AGNO_STEP_PROTOCOL.md`
- `docs/harness/play-store-agent-harness/RUN_ARTIFACT_SCHEMA.md`
- `docs/harness/play-store-agent-harness/AGENT_PLUGIN_SPEC.md`

每个 output claim 必须包含 `claim_id`、`value`、`source`、`status`、`confidence`、`claim_class`、`human_review_required`、`evidence_refs`、`limitations`。`C4` / `C5` 必须 `human_review_required=true`。缺少真实 Android build、EAS、signing、Play Console evidence 时，`release_status` 必须是 `blocked` 或 `needs_human`。

validator command: `python scripts/agent_tools/validate_release_build_agent.py .`

## Bundled Resources

- `scripts/validate.py`: thin skill-local validator entrypoint; delegates to `play-store-launch/validators/validate_release_build_agent.py`.
- `references/boundary.md`: load before changing ownership, evidence inputs, validator bindings, or workflow integration.

Do not copy shared runtime, model client, evidence helpers, or renderers into this skill. Keep shared code in `play-store-launch/shared/`.

## Validation Steps

```powershell
python scripts/agent_tools/validate_release_build_agent.py .
python scripts/agent_tools/validate_play_store_agent_mvp.py .
git diff --check
git status --short
```

失败分类使用：`pass`、`fail`、`blocked`、`tool_missing`、`environment_blocked`、`NEED_HUMAN`。

## Final Report Format

最终报告必须列出：

- changed files
- release gate status
- validation results
- generated outputs touched/restored
- unresolved `NEED_HUMAN`
- blockers
- whether Google Play submission remains out of scope

## Human Approval Points

- Google Play developer account and app creation.
- Android package id.
- EAS owner/projectId/build profile.
- Signing key and service account policy.
- Release track and rollout decision.
- Legal/privacy/trademark review before any public release action.
