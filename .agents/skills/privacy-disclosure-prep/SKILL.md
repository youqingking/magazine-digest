---
name: privacy-disclosure-prep
description: Prepare draft Google Play Data safety and privacy disclosure evidence for the no-credential Expo runtime shell. Use when Codex needs to map observed app data surfaces, privacy blockers, and human-review-required disclosure notes without claiming final legal correctness.
---

# privacy-disclosure-prep

## Goal

生成隐私披露准备材料（privacy disclosure prep），用于人工审核 Google Play Data safety。该 Skill 只整理 draft、data inventory、SDK inventory 和 evidence，不给出法律结论，不声明 Data safety 正确或完整。

## Required Inputs

- `AGENTS.md`
- `docs/NEED_HUMAN.md`
- `README.md`
- `apps/mobile/README.md`
- `docs/mobile/MOBILE_RUNTIME_SHELL.md`
- `docs/mobile/SUPABASE_ENV_CONTRACT.md`
- `docs/privacy/DATA_INVENTORY.md`
- `docs/privacy/SDK_INVENTORY.md`
- `docs/privacy/PLAY_STORE_PRIVACY_REVIEW.md`
- `docs/launch/google-play/data-safety-draft.md`
- `docs/launch/google-play/data-safety-evidence.md`

## Expected Outputs

- `docs/privacy/DATA_INVENTORY.md`
- `docs/privacy/SDK_INVENTORY.md`
- `docs/privacy/PLAY_STORE_PRIVACY_REVIEW.md`
- `docs/launch/google-play/data-safety-draft.md`
- `docs/launch/google-play/data-safety-evidence.md`
- `docs/launch/google-play/PLAY_STORE_SUBMISSION_READINESS.md`
- `evals/agents/privacy-disclosure-prep.eval.yaml`

## Do / Do Not Rules

Do:

- 只根据 repo evidence 记录 `implemented`、`reserved seam`、`NEED_HUMAN`。
- 对 Supabase、RevenueCat、Push、analytics、account/auth、payments、notifications 等未来 seam 保持 reserved 或 blocked。
- 保留 `product_key` 作为未来数据分区和 evidence 维度。
- 标记法律、隐私、Data safety、儿童政策、广告、跟踪、第三方 SDK、商标和 Play Store submission 结论为 `human review required`。

Do not:

- 不填写虚构 privacy policy URL、support email、公司地址、DPO 或法律联系人。
- 不添加 SDK、埋点、账号、支付、push permission、Supabase 连接或 RevenueCat 连接。
- 不修改 fixture source data 或 runtime generated outputs。
- 不把 draft 写成 policy approval、final compliance、ready to submit 或 submission ready。

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

Required repo evidence inputs include `docs/privacy/DATA_INVENTORY.md` and `docs/privacy/SDK_INVENTORY.md` plus current app/source docs. 每个 privacy claim 必须包含 `claim_id`、`value`、`source`、`status`、`confidence`、`claim_class`、`human_review_required`、`evidence_refs`、`limitations`。`C3` / `C4` 必须 `human_review_required=true`。

validator command: `python scripts/agent_tools/validate_privacy_disclosure_prep.py .`

## Bundled Resources

- `scripts/validate.py`: thin skill-local validator entrypoint; delegates to `play-store-launch/validators/validate_privacy_disclosure_prep.py`.
- `references/boundary.md`: load before changing ownership, evidence inputs, validator bindings, or workflow integration.

Do not copy shared runtime, model client, evidence helpers, or renderers into this skill. Keep shared code in `play-store-launch/shared/`.

## Validation Steps

```powershell
python scripts/agent_tools/validate_privacy_disclosure_prep.py .
python scripts/agent_tools/validate_play_store_agent_mvp.py .
git diff --check
git status --short
```

失败分类使用：`pass`、`fail`、`blocked`、`tool_missing`、`environment_blocked`、`NEED_HUMAN`。

## Final Report Format

最终报告必须列出：

- changed files
- data inventory and SDK inventory status
- Data safety draft/evidence status
- validation results
- unresolved `NEED_HUMAN`
- privacy/legal blockers
- statement that no Data safety conclusion is final

## Human Approval Points

- Privacy policy URL.
- Developer contact.
- Final SDK inventory from release artifact.
- Data collection, sharing, deletion, retention, and security answers.
- Children/family policy and target audience.
- Legal/privacy sign-off before Play Console use.
