# Failure Modes

## Shared Failure Modes

| Code | Meaning | Required response |
| --- | --- | --- |
| `missing_required_file` | A required contract, doc, validator, or evidence source is absent. | Stop and report blocker. |
| `invalid_claim_status` | Claim status is outside the enum. | Fail validation. |
| `missing_evidence_binding` | Claim lacks a ledger source. | Fail validation or mark claim `missing`. |
| `human_gate_missing` | Human review gate is absent for a required class. | Mark `needs_human` or `blocked`. |
| `forbidden_action_requested` | A C5 action is requested. | Refuse action and list blocker. |
| `forbidden_conclusion_word` | Forbidden conclusion term appears as an unapproved outcome. | Fail validation. |
| `agno_runtime_not_approved` | A run tries to use L3 or real Agno runtime without owner approval. | Keep status `dry_run_only` and stop. |
| `credential_or_account_needed` | External account or credential is required. | Mark `needs_human`. |
| `production_path_touched` | Forbidden runtime, config, migration, package, fixture, or credential path changed. | Stop and report. |
| `eval_protocol_missing` | Future eval cannot classify expected claims or gates. | Stop before automation. |

## Stop Conditions

- Any attempt to add real service credentials.
- Any attempt to submit to Google Play.
- Any attempt to run `eas submit`.
- Any attempt to modify app behavior for a harness milestone.
- Any attempt to promote M0 `dry_run_only` to `L3` without owner approval.
- Any `C3`, `C4`, or `C5` claim without `human_review_required=true`.
