---
name: google-data-safety-agent
description: Prepare Google Play Data Safety evidence drafts from DATA_INVENTORY, SDK_INVENTORY, LAUNCH_INFO, and privacy evidence without filling Play Console forms or claiming legal correctness.
---

# google-data-safety-agent

## Goal

基于 repo evidence 生成 Google Play Data Safety evidence draft。该 Skill 只产出 `C3` / `C4` evidence draft 和 human review gate，不填写 Play Console 表单，不声明 Data Safety 可用结论。

All privacy/legal/Data Safety decisions remain `human review required`.

## Required Inputs

- `docs/privacy/DATA_INVENTORY.md`
- `docs/privacy/SDK_INVENTORY.md`
- `docs/privacy/privacy-disclosure-prep-output.json`
- `docs/launch/LAUNCH_INFO.md`
- `docs/launch/privacy/human-review-required.md`
- `docs/launch/google-play/data-safety-draft.md`
- `docs/launch/google-play/data-safety-evidence.md`
- `docs/harness/play-store-agent-harness/INPUT_CONTRACT.md`
- `docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md`
- `docs/harness/play-store-agent-harness/EVIDENCE_LEDGER.md`
- `docs/harness/play-store-agent-harness/CLAIM_CLASSIFICATION.md`
- `docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md`
- `docs/harness/play-store-agent-harness/AGNO_STEP_PROTOCOL.md`
- `docs/harness/play-store-agent-harness/RUN_ARTIFACT_SCHEMA.md`
- `docs/harness/play-store-agent-harness/AGENT_PLUGIN_SPEC.md`

## Expected Outputs

- `docs/launch/google-play/data-safety-draft.md`
- `docs/launch/google-play/data-safety-evidence.md`
- `docs/launch/google-play/data-safety-human-review-required.md`
- `docs/launch/google-play/google-data-safety-agent-output.json`
- `artifacts/agno/play-store/m4/google-data-safety-agent.json`
- `evals/agents/google-data-safety-agent.eval.yaml`

## Do / Do Not Rules

Do:

- 引用 `DATA_INVENTORY.md`、`SDK_INVENTORY.md`、`LAUNCH_INFO.md` 和 privacy evidence。
- 所有 `C3` / `C4` claims 必须 `human_review_required=true`。
- 缺少 release artifact、SDK tree、privacy policy URL、developer contact 时使用 `needs_human` 或 `blocked`。

Do not:

- 不填写 Play Console Data Safety 表单。
- 不声明 privacy / Data Safety finality。
- 不添加 SDK、credentials、analytics、ads、tracking、RevenueCat、Supabase 或 Push 连接。

## Bundled Resources

- `scripts/validate.py`: thin skill-local validator entrypoint; delegates to `play-store-launch/validators/validate_google_data_safety_agent.py`.
- `references/boundary.md`: load before changing ownership, evidence inputs, validator bindings, or workflow integration.

Do not copy shared runtime, model client, evidence helpers, or renderers into this skill. Keep shared code in `play-store-launch/shared/`.

## Validation Steps

```powershell
python scripts/agent_tools/validate_google_data_safety_agent.py
python scripts/agent_tools/validate_play_store_agent_mvp.py
git diff --check
git status --short
```

validator command: `python scripts/agent_tools/validate_google_data_safety_agent.py`

## Final Report Format

- changed files
- Data Safety evidence draft status
- C3/C4 human gates
- validation results
- `NEED_HUMAN`
- blockers

## Human Approval Points

- Privacy policy URL.
- Developer contact.
- Data collection/sharing/deletion/retention/security answers.
- Release artifact SDK inventory.
- Children/family, ads/tracking, identifiers, diagnostics.
- Legal/privacy sign-off before Play Console use.
