---
name: launch-info-collector
description: Collect Play Store launch source-of-truth from repo evidence without guessing account, credential, legal, privacy, or submission facts. Use when Codex needs LAUNCH_INFO, store field status, and launch blockers for the Play Store Agent Harness.
---

# launch-info-collector

## Goal

收集 Play Store launch source-of-truth。该 Skill 只把 repo evidence、missing fields 和 `NEED_HUMAN` 汇总成 L2 evidence-bound output，不创建 Google Play app，不调用 Play Console，不添加 credentials。

All store/account/legal/submission decisions remain `human review required`.

## Required Inputs

- `README.md`
- `AGENTS.md`
- `apps/mobile/app.json`
- `apps/mobile/package.json`
- `docs/launch/LAUNCH_INFO.md`
- `docs/launch/store-fields/source-of-truth.json`
- `docs/harness/play-store-agent-harness/INPUT_CONTRACT.md`
- `docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md`
- `docs/harness/play-store-agent-harness/EVIDENCE_LEDGER.md`
- `docs/harness/play-store-agent-harness/CLAIM_CLASSIFICATION.md`
- `docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md`
- `docs/harness/play-store-agent-harness/AGNO_STEP_PROTOCOL.md`
- `docs/harness/play-store-agent-harness/RUN_ARTIFACT_SCHEMA.md`
- `docs/harness/play-store-agent-harness/AGENT_PLUGIN_SPEC.md`

## Expected Outputs

- `docs/launch/LAUNCH_INFO.md`
- `docs/launch/store-fields/source-of-truth.json`
- `docs/launch/launch-info-collector-output.json`
- `artifacts/agno/play-store/m4/launch-info-collector.json`
- `evals/agents/launch-info-collector.eval.yaml`

## Do / Do Not Rules

Do:

- 标注每个 field 的 `observed_in_repo`、`inferred`、`missing` 或 `needs_human`。
- 对 inferred facts 添加 source 和 limitations。
- 把 Play Console app、Android package、EAS、privacy policy、developer contact、content rating、target audience 标为 `NEED_HUMAN`，除非 repo 有明确 evidence。

Do not:

- 不把推断写成 observed fact。
- 不使用真实 credentials。
- 不调用 Play Console API。
- 不声明 public store metadata 已经可以使用。

## Bundled Resources

- `scripts/validate.py`: thin skill-local validator entrypoint; delegates to `play-store-launch/validators/validate_launch_info_collector.py`.
- `references/boundary.md`: load before changing ownership, evidence inputs, validator bindings, or workflow integration.

Do not copy shared runtime, model client, evidence helpers, or renderers into this skill. Keep shared code in `play-store-launch/shared/`.

## Validation Steps

```powershell
python scripts/agent_tools/validate_launch_info_collector.py
python scripts/agent_tools/validate_play_store_agent_mvp.py
git diff --check
git status --short
```

validator command: `python scripts/agent_tools/validate_launch_info_collector.py`

## Final Report Format

- changed files
- field status summary
- evidence-bound claim count
- `NEED_HUMAN`
- validation results
- blockers

## Human Approval Points

- Google Play developer account and app.
- Android package and EAS identity.
- Privacy policy URL and Developer contact.
- Category, content rating, target audience.
- Store submission and rollout decision.
