---
name: screenshot-storyboard
description: Prepare Google Play screenshot storyboard and shot-list drafts for the current Expo runtime shell. Use when Codex needs screenshot planning, capture guardrails, or store visual evidence without inventing screens, unavailable features, or final submission assets.
---

# screenshot-storyboard

## Goal

为 Play Store screenshot 做 storyboard、shot-list 和 validation notes 草稿。该 Skill 只规划可截图画面与 evidence，不生成最终上架素材，不展示不可用功能。

## Required Inputs

- `AGENTS.md`
- `README.md`
- `apps/mobile/README.md`
- `docs/mobile/MOBILE_RUNTIME_SHELL.md`
- `docs/launch/screenshots/storyboard.md`
- `docs/launch/screenshots/shot-list.json`
- `docs/launch/screenshots/screenshot-validation-notes.md`
- `docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md`

## Expected Outputs

- `docs/launch/screenshots/storyboard.md`
- `docs/launch/screenshots/shot-list.json`
- `docs/launch/screenshots/screenshot-validation-notes.md`
- `docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md`
- `evals/agents/screenshot-storyboard.eval.yaml`

## Do / Do Not Rules

Do:

- 只使用当前 app routes：`/`、`/article/[articleId]`、`/debug`。
- 对每个 shot 写清 route、fixture/scenario、visible evidence、must_not_show 和 human review 状态。
- 把 `/debug` 保持为 internal evidence，除非人工确认可公开使用。
- 标记真实截图捕获、设备规格、裁切、视觉审核、商标审核和内容授权为 `human review required`。

Do not:

- 不创建或提交最终截图图片。
- 不展示 live Supabase、RevenueCat purchase/paywall、Push permission、account sign-in、cloud sync 或 production content pipeline。
- 不修改 app source behavior 来迎合截图。
- 不把 storyboard 写成 image spec approval、final compliance、ready to submit 或 submission ready。

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

Expected human-readable output includes `docs/launch/screenshots/storyboard.md` and `docs/launch/screenshots/screenshot-human-review-required.md`; validation notes remain at `docs/launch/screenshots/screenshot-validation-notes.md`。每个 shot 必须绑定真实 route、runtime scenario、fixture source 和 claim ids。每个 output claim 必须包含 `claim_id`、`value`、`source`、`status`、`confidence`、`claim_class`、`human_review_required`、`evidence_refs`、`limitations`。`C2` / `C4` 必须 human review。

validator command: `python scripts/agent_tools/validate_screenshot_storyboard.py .`

## Bundled Resources

- `scripts/validate.py`: thin skill-local validator entrypoint; delegates to `play-store-launch/validators/validate_screenshot_storyboard.py`.
- `references/boundary.md`: load before changing ownership, evidence inputs, validator bindings, or workflow integration.

Do not copy shared runtime, model client, evidence helpers, or renderers into this skill. Keep shared code in `play-store-launch/shared/`.

## Validation Steps

```powershell
python scripts/agent_tools/validate_screenshot_storyboard.py .
python scripts/agent_tools/validate_play_store_agent_mvp.py .
git diff --check
git status --short
```

失败分类使用：`pass`、`fail`、`blocked`、`tool_missing`、`environment_blocked`、`NEED_HUMAN`。

## Final Report Format

最终报告必须列出：

- changed files
- storyboard and shot-list status
- screenshot validation notes status
- validation results
- generated outputs touched/restored
- unresolved `NEED_HUMAN`
- statement that screenshots are draft planning assets only

## Human Approval Points

- Real device or emulator capture plan.
- Google Play image spec review.
- Trademark/content authorization.
- Public store asset selection.
- Human approval before using screenshots in Play Console.
