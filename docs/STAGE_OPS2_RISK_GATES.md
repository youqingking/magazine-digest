# Stage OPS2 Risk Gates

## Decision Inputs

- scenario existence / status
- selected / current / baseline integrity
- scenario diff severity buckets
- metadata quality report
- warning taxonomy report
- override report
- TEST1 final report
- TEST1 content contract / parser golden / lifecycle / app regression reports

## Blockers

- candidate scenario missing
- candidate scenario retired
- baseline scenario missing or not restorable
- selected pointer references missing scenario
- current mirror references missing scenario
- TEST1 final not passed
- content contract not passed
- parser golden not passed
- lifecycle not passed
- app regression not passed
- metadata quality / warning / override report missing
- diff reports product_key mismatch
- diff reports paywall semantics regression
- diff reports lifecycle provenance mismatch
- diff reports unexpected issue/publication removal against baseline/current target

## Warnings

- accepted Reader's Digest ordinal gap
- accepted Economist anomaly / section fallback warning
- warning taxonomy increase within accepted classes
- override count drift
- audience coverage drift that does not break contracts
- mixed preview expansion relative to single-publication baseline
- candidate differs from current/selected only by expected inventory growth

## Informational

- article ids added / removed sample
- publication list expansion
- issue list expansion
- build label / export timestamp changes
- selected vs current divergence before publish

## Merge Rule

- if any blocker exists -> promotion decision `blocked`
- else if any warning exists -> promotion decision `hold_warning`
- else -> promotion decision `promotable`

## Publish Rule

- `publish` and `rollback` remain explicit actions
- `promote-scenario --apply` may proceed only when:
  - decision is `promotable`, or
  - decision is `hold_warning` and operator passed `--force-with-warning`
- any blocker must fail fast before writing `current`

## Reporting Rule

每次 evaluate / promote 都必须产出：

- blockers
- warnings
- info
- compared references
- gate status
- final promotion decision
