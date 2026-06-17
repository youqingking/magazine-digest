# Agent Plugin Spec

This file defines per-agent plugin specs for the Play Store Agent Harness.
These specs are adapter contracts only for harness integration. M1 patch did not harden existing agents; M2 hardens the old four agents to L2 evidence-bound outputs. M4 implements the remaining four agents to L2 evidence-bound outputs.

## Shared Rules

- Current Agno status inherited from M0: `dry_run_only`.
- Current Agno boundary: L2 Agno-ready only, not `L3`.
- Old four agents are M2 hardened to `current_maturity: L2` when their evidence-bound outputs and validators pass.
- Remaining four agents are M4 implemented to `current_maturity: L2`.
- `C3`, `C4`, and `C5` claims must set `human_review_required=true`.
- `C5` actions are forbidden; specs may list blockers only.
- Forbidden conclusion terms must remain negative guardrail terms only:
  forbidden-term examples: `final`, `approved`, `submitted`, `complete`, `production_ready`.

## Required Agent Spec Fields

Each agent spec must include:

- `agent_id`
- `implementation_status`
- `current_maturity`
- `target_maturity`
- `implementation_milestone`
- `actual_outputs_present`
- `validator_present`
- `agno_step_artifact_present`
- `allowed_inputs`
- `forbidden_inputs`
- `expected_outputs_human_readable`
- `expected_outputs_machine_readable`
- `output_schema_ref`
- `evidence_requirements`
- `expected_claim_classes`
- `human_gate_rules`
- `validator_command` or `future_validator_command`
- `eval_cases_ref` or `future_eval_cases_ref`
- `agno_step_adapter` or `future_agno_step_adapter`
- `forbidden_actions`
- `readiness_blockers`

## `release-build-agent`

```yaml
agent_id: release-build-agent
implementation_status: existing_needs_hardening
current_maturity: L2
target_maturity: L2
implementation_milestone: M2
actual_outputs_present: true
validator_present: true
agno_step_artifact_present: true
allowed_inputs:
  - AGENTS.md
  - docs/NEED_HUMAN.md
  - docs/launch/release/PLAY_STORE_RELEASE_GATE.md
  - docs/release/PLAY_STORE_RELEASE_DRY_RUN.md
  - repo commands: npm ci, typecheck, smoke:fixture, start:smoke, validate:preflight
forbidden_inputs:
  - real service credentials
  - Play Console credentials
  - signing keys or keystore material
  - production config
expected_outputs_human_readable:
  - release gate
  - Android build readiness notes
  - technical blockers
expected_outputs_machine_readable:
  - output claims using OUTPUT_CONTRACT.md
  - evidence rows using EVIDENCE_LEDGER.md
output_schema_ref: docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md
evidence_requirements:
  - command evidence for build/typecheck/smoke/preflight
  - repo file evidence for release identity blockers
  - missing EAS or signing inputs must become blocked claims
expected_claim_classes:
  - C0
  - C1
  - C4
  - C5
human_gate_rules:
  - C4 and C5 must set human_review_required=true
  - missing Android build, EAS, signing, or Play account evidence must be blocked, not ready
validator_command: python scripts/agent_tools/validate_release_build_agent.py .
eval_cases_ref: evals/agents/release-build-agent.eval.yaml
agno_step_adapter: dry_run_only artifact at artifacts/agno/play-store/m2/release-build-agent.json; not L3
forbidden_actions:
  - do not run eas submit
  - do not call Play Console API
  - do not add credentials
  - do not claim release approval
readiness_blockers:
  - signed Android build evidence missing
  - EAS owner/projectId/build profile needs_human
  - Play Console app and signing policy needs_human
```

## `privacy-disclosure-prep`

```yaml
agent_id: privacy-disclosure-prep
implementation_status: existing_needs_hardening
current_maturity: L2
target_maturity: L2
implementation_milestone: M2
actual_outputs_present: true
validator_present: true
agno_step_artifact_present: true
allowed_inputs:
  - docs/privacy/DATA_INVENTORY.md
  - docs/privacy/SDK_INVENTORY.md
  - docs/privacy/PLAY_STORE_PRIVACY_REVIEW.md
  - docs/launch/google-play/data-safety-evidence.md
  - repo manifests and current app config evidence
forbidden_inputs:
  - private user data
  - real service credentials
  - unpublished legal decisions
  - Play Console form credentials
expected_outputs_human_readable:
  - DATA_INVENTORY update plan
  - SDK_INVENTORY update plan
  - privacy disclosure draft
  - human review required notes
expected_outputs_machine_readable:
  - output claims using OUTPUT_CONTRACT.md
  - C3 evidence rows using EVIDENCE_LEDGER.md
output_schema_ref: docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md
evidence_requirements:
  - repo manifests for SDK evidence
  - app config and source refs for observed data surfaces
  - limitations for release artifact gaps
expected_claim_classes:
  - C0
  - C1
  - C3
  - C4
human_gate_rules:
  - C3 must set human_review_required=true
  - C4 must set human_review_required=true
  - privacy evidence stays draft only
validator_command: python scripts/agent_tools/validate_privacy_disclosure_prep.py .
eval_cases_ref: evals/agents/privacy-disclosure-prep.eval.yaml
agno_step_adapter: dry_run_only artifact at artifacts/agno/play-store/m2/privacy-disclosure-prep.json; not L3
forbidden_actions:
  - do not claim privacy finality
  - do not claim policy approval
  - do not add SDKs or credentials
  - do not submit Data Safety answers
readiness_blockers:
  - release artifact SDK inventory missing
  - privacy policy URL needs_human
  - developer contact needs_human
  - data retention/deletion/security answers need human review
```

## `google-play-listing`

```yaml
agent_id: google-play-listing
implementation_status: existing_needs_hardening
current_maturity: L2
target_maturity: L2
implementation_milestone: M2
actual_outputs_present: true
validator_present: true
agno_step_artifact_present: true
allowed_inputs:
  - docs/launch/store-fields/source-of-truth.json
  - docs/launch/google-play/listing.en-US.json
  - docs/launch/google-play/listing.zh-CN.json
  - docs/launch/google-play/listing-validation-report.md
  - repo evidence for actual implemented app features
forbidden_inputs:
  - invented app capabilities
  - fabricated privacy promises
  - unreviewed trademark claims
  - Play Console submission state
expected_outputs_human_readable:
  - listing-validation-report.md
  - owner/Pro review notes
expected_outputs_machine_readable:
  - listing.en-US.json
  - listing.zh-CN.json
  - output claims using OUTPUT_CONTRACT.md
output_schema_ref: docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md
evidence_requirements:
  - app name length <= 30
  - short description length <= 80
  - full description length <= 4000
  - listing claims must cite observed app features or source-of-truth blockers
expected_claim_classes:
  - C0
  - C1
  - C2
  - C4
human_gate_rules:
  - C2 requires owner or Pro review before public use
  - C4 must set human_review_required=true
validator_command: python scripts/agent_tools/validate_google_play_listing.py .
eval_cases_ref: evals/agents/google-play-listing.eval.yaml
agno_step_adapter: dry_run_only artifact at artifacts/agno/play-store/m2/google-play-listing.json; not L3
forbidden_actions:
  - do not claim #1, best, top, or award-winning status
  - do not use keyword stuffing
  - do not invent unavailable features
  - do not claim listing submission approval
readiness_blockers:
  - privacy policy URL needs_human
  - developer contact needs_human
  - category, rating, target audience, trademark review need human review
```

## `screenshot-storyboard`

```yaml
agent_id: screenshot-storyboard
implementation_status: existing_needs_hardening
current_maturity: L2
target_maturity: L2
implementation_milestone: M2
actual_outputs_present: true
validator_present: true
agno_step_artifact_present: true
allowed_inputs:
  - docs/launch/screenshots/storyboard.md
  - docs/launch/screenshots/shot-list.json
  - current app routes
  - runtime scenario and fixture source refs
forbidden_inputs:
  - fabricated screenshots
  - unimplemented feature screens
  - public-use approval for screenshots
  - device credentials
expected_outputs_human_readable:
  - storyboard.md
  - screenshot-human-review-required.md
expected_outputs_machine_readable:
  - shot-list.json
  - output claims using OUTPUT_CONTRACT.md
output_schema_ref: docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md
evidence_requirements:
  - route evidence for each planned shot
  - scenario or fixture source ref for each planned shot
  - must_not_show guardrails
expected_claim_classes:
  - C0
  - C1
  - C2
  - C4
human_gate_rules:
  - C2 and C4 require human_review_required=true before public screenshot use
validator_command: python scripts/agent_tools/validate_screenshot_storyboard.py .
eval_cases_ref: evals/agents/screenshot-storyboard.eval.yaml
agno_step_adapter: dry_run_only artifact at artifacts/agno/play-store/m2/screenshot-storyboard.json; not L3
forbidden_actions:
  - do not capture screenshots in M2 storyboard hardening
  - do not fabricate screenshots
  - do not show unavailable features
  - do not claim Play Console screenshot approval
readiness_blockers:
  - real device or emulator capture plan needs_human
  - image spec review needs_human
  - fixture readability and content authorization need human review
```

## `launch-info-collector`

```yaml
agent_id: launch-info-collector
implementation_status: implemented
current_maturity: L2
target_maturity: L2
implementation_milestone: M4
actual_outputs_present: true
validator_present: true
agno_step_artifact_present: true
allowed_inputs:
  - future owner-provided launch source facts
  - repo-local launch docs
  - app identity docs
forbidden_inputs:
  - guessed Play Console account state
  - real service credentials
  - private legal documents without owner approval
expected_outputs_human_readable:
  - LAUNCH_INFO.md
expected_outputs_machine_readable:
  - store-fields/source-of-truth.json
  - output claims using OUTPUT_CONTRACT.md
output_schema_ref: docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md
evidence_requirements:
  - distinguish observed_in_repo, inferred, missing, and needs_human
  - every inferred product fact must cite evidence and limitations
expected_claim_classes:
  - C0
  - C1
  - C2
  - C4
  - C5
human_gate_rules:
  - C4 and C5 must set human_review_required=true
validator_command: python scripts/agent_tools/validate_launch_info_collector.py
eval_cases_ref: evals/agents/launch-info-collector.eval.yaml
agno_step_adapter: dry_run_only artifact at artifacts/agno/play-store/m4/launch-info-collector.json; not L3
forbidden_actions:
  - do not turn inference into observed fact
  - do not add credentials
readiness_blockers:
  - Play Console source of truth needs_human
  - app identity owner decisions need_human
```

## `google-data-safety-agent`

```yaml
agent_id: google-data-safety-agent
implementation_status: implemented
current_maturity: L2
target_maturity: L2
implementation_milestone: M4
actual_outputs_present: true
validator_present: true
agno_step_artifact_present: true
allowed_inputs:
  - future DATA_INVENTORY evidence
  - future SDK_INVENTORY evidence
  - privacy-disclosure-prep evidence ledger output
forbidden_inputs:
  - fabricated Data Safety answers
  - Play Console credentials
  - private user data
expected_outputs_human_readable:
  - data-safety-draft.md
  - data-safety-evidence.md
  - data-safety-human-review-required.md
expected_outputs_machine_readable:
  - C3/C4 output claims using OUTPUT_CONTRACT.md
  - evidence rows using EVIDENCE_LEDGER.md
output_schema_ref: docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md
evidence_requirements:
  - Data Safety claims must cite DATA_INVENTORY and SDK_INVENTORY evidence
  - missing release artifact evidence must remain needs_human or blocked
expected_claim_classes:
  - C0
  - C1
  - C3
  - C4
human_gate_rules:
  - C3 and C4 must set human_review_required=true
validator_command: python scripts/agent_tools/validate_google_data_safety_agent.py
eval_cases_ref: evals/agents/google-data-safety-agent.eval.yaml
agno_step_adapter: dry_run_only artifact at artifacts/agno/play-store/m4/google-data-safety-agent.json; not L3
forbidden_actions:
  - do not claim Data Safety finality
  - do not submit Play Console forms
readiness_blockers:
  - release artifact SDK evidence missing
  - Data Safety owner review needs_human
```

## `screenshot-capture-agent`

```yaml
agent_id: screenshot-capture-agent
implementation_status: implemented
current_maturity: L2
target_maturity: L2
implementation_milestone: M4
actual_outputs_present: true
validator_present: true
agno_step_artifact_present: true
allowed_inputs:
  - future storyboard and shot-list
  - future device or emulator config
  - future Expo route rendering evidence
forbidden_inputs:
  - fabricated screenshots
  - image assets without route evidence
  - private credentials
expected_outputs_human_readable:
  - capture-report.md
  - capture-blockers.md
expected_outputs_machine_readable:
  - artifacts/screenshots/raw/android/en-US/*.png
  - screenshot capture manifest using OUTPUT_CONTRACT.md
output_schema_ref: docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md
evidence_requirements:
  - each future screenshot must record route, device, locale, and commit hash
  - if emulator, device, Expo tooling, or route rendering is missing, capture_status=blocked
expected_claim_classes:
  - C0
  - C1
  - C2
  - C4
human_gate_rules:
  - C2 and C4 require human_review_required=true before public asset use
validator_command: python scripts/agent_tools/validate_screenshot_capture_agent.py
eval_cases_ref: evals/agents/screenshot-capture-agent.eval.yaml
agno_step_adapter: dry_run_only artifact at artifacts/agno/play-store/m4/screenshot-capture-agent.json; not L3
forbidden_actions:
  - do not fabricate screenshots
  - do not bypass capture_status=blocked when tooling is missing
readiness_blockers:
  - device/emulator and route rendering evidence needs_human
  - screenshot public-use review needs_human
```

## `launch-package-agent`

```yaml
agent_id: launch-package-agent
implementation_status: implemented
current_maturity: L2
target_maturity: L2
implementation_milestone: M4
actual_outputs_present: true
validator_present: true
agno_step_artifact_present: true
allowed_inputs:
  - future outputs from the first seven agents
  - future evidence ledger instances
  - future human approval gate status
forbidden_inputs:
  - draft-only outputs treated as store approval
  - Play Console credentials
  - production release credentials
expected_outputs_human_readable:
  - PLAY_STORE_SUBMISSION_READINESS.md
  - readiness-report.md
expected_outputs_machine_readable:
  - manifest.json
  - readiness claims using OUTPUT_CONTRACT.md
output_schema_ref: docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md
evidence_requirements:
  - readiness can only be GREEN, YELLOW, or RED
  - every GREEN must cite evidence and human gate decisions
  - unresolved C3/C4/C5 gates force YELLOW or RED
expected_claim_classes:
  - C0
  - C1
  - C2
  - C3
  - C4
  - C5
human_gate_rules:
  - C3, C4, and C5 must set human_review_required=true
validator_command: python scripts/agent_tools/validate_launch_package_agent.py
eval_cases_ref: evals/agents/launch-package-agent.eval.yaml
agno_step_adapter: dry_run_only artifact at artifacts/agno/play-store/m4/launch-package-agent.json; not L3
forbidden_actions:
  - do not package drafts as approved submission
  - do not claim production_ready
readiness_blockers:
  - first seven agent outputs not available
  - human approval gate decisions missing
  - Play submission owner decision needs_human
```
