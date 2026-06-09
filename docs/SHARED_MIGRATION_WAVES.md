# Shared Migration Waves

## Purpose

Step 02 freezes the migration waves so later work can move in bounded, additive steps.

References:

- `docs/MIGRATION_MAP.md`
- `docs/SHARED_CHANGE_POLICY.md`
- `docs/STEP_02_ACCEPTANCE.md`

## Wave 1: Pure Contracts And Vocabulary

Goal:

- freeze shared canonical models
- freeze shared enums, keys, and naming rules
- freeze public API boundaries

Inputs:

- `docs/SHARED_BASE.md`
- `docs/DOMAIN_SPLIT.md`
- `docs/MIGRATION_MAP.md`
- Stage B / F0 / F1 / G / H0 contract and vocabulary docs

Outputs:

- shared contract docs
- package public surface skeletons
- domain mapping examples

Does not do:

- move runtime code
- change current domain implementation
- add real infra

Risks:

- overfreezing unstable fields
- accidental domain leakage in shared naming

## Wave 2: Shared Runtime Seams, Registries, And Harness Contracts

Goal:

- formalize runtime adapter seams
- formalize registry shapes
- formalize harness validation seams

Inputs:

- Wave 1 frozen contracts
- current runtime service and backend surface inventory

Outputs:

- runtime seam metadata
- registry boundary metadata
- harness validation/report shapes

Does not do:

- implement domain mappings
- run live remote connectivity
- rewrite existing services

Risks:

- exposing too much implementation detail in shared runtime
- coupling shared runtime to one domain adapter

## Wave 3: Shared UI Primitives And Admin Registries

Goal:

- migrate reusable shell-safe UI primitives
- migrate shared admin registry conventions

Inputs:

- Wave 1 contract freeze
- Wave 2 runtime seam freeze
- existing shell-safe UI and shared admin surface inventory

Outputs:

- shared primitive components
- shared presentation contracts
- shared admin generated/manual registries

Does not do:

- create business pages
- migrate domain-only workflows
- redesign domain navigation

Risks:

- page composition leaking into shared UI
- admin rails accidentally encoding one domain workflow

## Wave 4: Domain Code Gradual Migration To Shared Adapters

Goal:

- move existing domain code behind shared facades in small slices
- make magazine the first adapter consumer
- prepare future YouTube adapter integration

Inputs:

- Wave 1, Wave 2, and Wave 3 stable seams
- reviewed migration map for each moved slice

Outputs:

- domain adapters consuming shared contracts/runtime/ui/admin seams
- smaller domain-owned surface area

Does not do:

- big-bang rename of collections
- one-shot runtime rewrite
- infra cutover

Risks:

- hidden coupling in current code
- migration drift if adapters and docs diverge

## Step 02 Limit

Step 02 stops at:

- all of Wave 1
- partial Wave 2 skeleton only

Step 02 does not enter:

- large-scale code migration
- shared UI implementation migration
- shared admin implementation migration
- real runtime or infra integration
