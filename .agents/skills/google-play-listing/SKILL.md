---
name: google-play-listing
description: Prepare draft Google Play listing source-of-truth and localized listing JSON for the current Expo runtime shell. Use when Codex needs Play Store listing metadata, copy guardrails, localization drafts, or listing validation without claiming unavailable features or submitting to Google Play.
---

# google-play-listing

## Goal

维护 Play Store listing 的 source-of-truth 与 localized draft。该 Skill 只生成可审查 metadata draft 和 validation evidence，不提交，不访问 Google Play API，不虚构未实现功能。

## Required Inputs

- `AGENTS.md`
- `README.md`
- `apps/mobile/README.md`
- `docs/mobile/MOBILE_RUNTIME_SHELL.md`
- `docs/launch/LAUNCH_INFO.md`
- `docs/launch/store-fields/source-of-truth.json`
- `docs/launch/google-play/listing.en-US.json`
- `docs/launch/google-play/listing.zh-CN.json`
- `docs/launch/google-play/listing-validation-report.md`
- `docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md`

## Expected Outputs

- `docs/launch/store-fields/source-of-truth.json`
- `docs/launch/google-play/listing.en-US.json`
- `docs/launch/google-play/listing.zh-CN.json`
- `docs/launch/google-play/listing-validation-report.md`
- `docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md`
- `docs/agents/PLAY_STORE_AGENT_REGISTRY.md`
- `evals/agents/google-play-listing.eval.yaml`

## Do / Do Not Rules

Do:

- 从 source-of-truth JSON 读取 app identity、implemented capabilities、non-goals 和 human blockers。
- 只描述当前存在的 fixture-backed discovery、article detail、debug/seam readiness 或明确为 draft 的内容。
- 检查 Google Play field length：`appName <= 30`、`shortDescription <= 80`、`fullDescription <= 4000`。
- 对 trademark、policy、listing claim、category、content rating、privacy policy、developer contact、submission 结论标记 `human review required`。

Do not:

- 不声明 app 已经上架、通过审核、完成 Data safety 或具备未实现能力。
- 不硬编码价格、免费额度、订阅权益、feature flags、实验参数、运营阈值或风控阈值。
- 不使用第三方商标、杂志品牌或出版物名称作为营销承诺，除非有授权 evidence 并经人工审核。
- 不把 listing draft 写成 approval、final compliance、ready to submit 或 submission ready。

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

Listing draft fields must satisfy `appName <= 30`, `shortDescription <= 80`, and `fullDescription <= 4000`. 每个 listing claim 必须包含 `claim_id`、`value`、`source`、`status`、`confidence`、`claim_class`、`human_review_required`、`evidence_refs`、`limitations`。`C2` 需要 owner/Pro review；`C4` 必须 `human_review_required=true`。

validator command: `python scripts/agent_tools/validate_google_play_listing.py .`

## Bundled Resources

- `scripts/validate.py`: thin skill-local validator entrypoint; delegates to `play-store-launch/validators/validate_google_play_listing.py`.
- `references/boundary.md`: load before changing ownership, evidence inputs, validator bindings, or workflow integration.

Do not copy shared runtime, model client, evidence helpers, or renderers into this skill. Keep shared code in `play-store-launch/shared/`.

## Validation Steps

```powershell
python scripts/agent_tools/validate_google_play_listing.py .
python scripts/agent_tools/validate_play_store_agent_mvp.py .
git diff --check
git status --short
```

失败分类使用：`pass`、`fail`、`blocked`、`tool_missing`、`environment_blocked`、`NEED_HUMAN`。

## Final Report Format

最终报告必须列出：

- changed files
- listing source-of-truth status
- localized listing field length status
- listing claim guardrails
- validation results
- unresolved `NEED_HUMAN`
- statement that listing is draft only

## Human Approval Points

- Privacy policy URL.
- Developer contact email.
- Category, content rating, and target audience.
- Trademark/content authorization.
- Human review of listing claims before Play Console use.
