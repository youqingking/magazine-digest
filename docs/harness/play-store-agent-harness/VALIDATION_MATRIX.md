# Validation Matrix

The validation matrix maps substrate requirements to validators.

## Required M1 Validator

```powershell
python scripts/agent_tools/validate_play_store_agent_harness.py .
```

## Matrix

| Area | Required check | Validator responsibility |
| --- | --- | --- |
| Required files | All M1 substrate docs and validator exist | Check required paths. |
| Claim status enum | All six enum values are present | Check `CLAIM_CLASSIFICATION.md`. |
| Forbidden terms | Forbidden terms are documented and not used as outcomes | Check guarded usage. |
| Output contract | Claims include `value`, `source`, `status`, `confidence`, `claim_class`, `human_review_required` | Check `OUTPUT_CONTRACT.md`. |
| Evidence ledger | Ledger schema fields are present | Check `EVIDENCE_LEDGER.md`. |
| Human approval gate | Gate schema fields are present | Check `HUMAN_APPROVAL_GATE.md`. |
| C3/C4/C5 rules | Human review is required for these classes | Check classification and output rules. |
| Agno step schema | Step artifact schema fields are present | Check `AGNO_STEP_PROTOCOL.md` and `RUN_ARTIFACT_SCHEMA.md`. |
| M0 Agno status | `dry_run_only` is not promoted to `L3` | Check M0 report and Agno protocol docs. |
| Eval protocol | Eval case and result fields are present | Check `EVAL_PROTOCOL.md`. |
| Failure modes | Shared failure taxonomy exists | Check `FAILURE_MODES.md`. |

## Broader Validation

After the harness validator passes, the M1 thread must also run the existing
no-credential repo validation commands requested by owner:

```powershell
npm.cmd ci
npm.cmd --prefix apps/mobile run typecheck
npm.cmd --prefix apps/mobile run smoke:fixture
npm.cmd --prefix apps/mobile run start:smoke
npm.cmd run validate:preflight
git diff --check
git status --short
```
