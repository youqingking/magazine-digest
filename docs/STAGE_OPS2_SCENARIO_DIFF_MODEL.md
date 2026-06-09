# Stage OPS2 Scenario Diff Model

## Compare Targets

OPS2 至少支持：

- candidate vs current
- candidate vs selected
- candidate vs baseline
- mixed preview vs single-publication baseline

## Scenario Identity

每次 compare 必须记录：

- `from_scenario_id`
- `to_scenario_id`
- `from_state_role`
- `to_state_role`
- source bundle path
- scenario status
- selected/current/published flags

## Required Diff Dimensions

### Inventory

- scenario id
- publication count
- issue count
- article count
- publication list
- issue list
- article ids added
- article ids removed

### Quality / Semantics

- warning counts by taxonomy
- override counts
- parser profile coverage
- audience coverage
- paywall test rule / quota semantics
- metadata quality summary

### Lifecycle / Publish State

- scenario status
- retired state
- selected pointer state
- current published state
- published / selected timestamps when present

## Severity Classification

### Blocker

- compared scenario missing
- scenario retired but requested for promotion
- product_key mismatch
- paywall rule key or quota semantics regression without explicit support
- metadata quality required failure implied by upstream reports
- lifecycle provenance mismatch

### Warning

- warning taxonomy count increase
- override count increase or decrease requiring review
- parser coverage shrink
- audience coverage shrink
- publication / issue removal relative to target baseline/current
- mixed preview differs from baseline by expected expansion but still needs acknowledgement

### Informational

- article additions
- publication additions
- issue additions
- timestamp / build label drift
- selected/current state differences that are expected for preview

## Report Outputs

- `output/stage-ops2/scenario-diff-report.json`
  - machine-readable full diff
- `output/stage-ops2/scenario-diff-summary.md`
  - operator-facing summary with severity buckets

## Diff Consumption Rules

- promotion evaluation must consume the latest diff report
- publish may not skip compare
- compare itself does not mutate selected/current
