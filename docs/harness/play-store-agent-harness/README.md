# Play Store Agent Harness

M1 Common Harness Substrate defines the shared contract layer for Play Store
agent work. It is intentionally L2 Agno-ready and `dry_run_only`.

## Scope

This substrate is for Play Store launch-prep agents that produce repo-local
drafts, evidence, blockers, validation reports, and human review gates.

This substrate does not add Agno dependency, does not adopt L3 runtime, does not
connect Google Play, does not add credentials, and does not execute production
actions.

## Required Contracts

- `INPUT_CONTRACT.md`
- `OUTPUT_CONTRACT.md`
- `EVIDENCE_LEDGER.md`
- `CLAIM_CLASSIFICATION.md`
- `HUMAN_APPROVAL_GATE.md`
- `VALIDATION_MATRIX.md`
- `AGNO_STEP_PROTOCOL.md`
- `RUN_ARTIFACT_SCHEMA.md`
- `EVAL_PROTOCOL.md`
- `FAILURE_MODES.md`
- `AGENT_PLUGIN_SPEC.md`

## Claim Status Enum

- `observed_in_repo`
- `inferred`
- `missing`
- `blocked`
- `needs_human`
- `not_applicable`

## Claim Classes

- `C0`: observed technical fact
- `C1`: inferred product fact
- `C2`: marketing wording
- `C3`: privacy / data safety claim
- `C4`: legal / policy / store submission claim
- `C5`: credential / account / production action

## Maturity Levels

Harness maturity:

- `H0`: no harness
- `H1`: common docs exist
- `H2`: common docs + validators + per-agent plugin specs
- `H3`: Agno run artifacts + evidence ledger + readiness report
- `H4`: scheduled automation candidate

Agent maturity:

- `L0`: name only
- `L1`: SKILL/docs/validator exists
- `L2`: produces evidence-bound real repo output
- `L3`: produces step artifact in Agno workflow
- `L4`: stable enough for automation candidate

## Current M1 Classification

- Harness target after this milestone: `H2`
- Current Agno status inherited from M0: `dry_run_only`
- Agno maturity allowed now: L2 Agno-ready only
- Agno maturity not allowed now: `L3`

## Forbidden Conclusion Terms

The following conclusion words must not be used as unapproved outcomes:

- `final`
- `approved`
- `submitted`
- `complete`
- `production_ready`

They may appear only as forbidden-term examples, negative guardrails, blocked
states, or human-review warnings.
