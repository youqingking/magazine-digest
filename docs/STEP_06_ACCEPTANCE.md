# Step 06 Acceptance

## Goal

Step 06 is complete only when the first selected-domain runtime adoption path is executable and validated without changing the frozen Step 02 to Step 05 boundaries.

References:

- `docs/SELECTED_DOMAIN_ADOPTION.md`
- `docs/DOMAIN_PROJECTION_FIXTURES.md`
- `docs/SHARED_RUNTIME_ADOPTION_RULES.md`
- `docs/FAMILY_ONLY_PILOT_HANDLING.md`
- `docs/STAGE_SHARED_STEP06_DECISIONS.md`

## Required Artifacts

- all Step 06 docs listed above
- core runtime adoption helper files
- family runtime execution helper files
- adapter runtime execution and diagnostics helper files
- adapter harness adoption report shape files
- selected-domain adoption runner files and fixtures
- family-only SEC report
- `scripts/contracts/validate-shared-step-06.mjs`
- `scripts/contracts/validate-shared-step-06.ps1`
- `output/shared-step-06/validation-report.json`
- `output/shared-step-06/domain-adoption-report.json`

## Validation Commands

- `node scripts/contracts/validate-shared-step-06.mjs`
- `powershell -ExecutionPolicy Bypass -File scripts/contracts/validate-shared-step-06.ps1`

## Acceptance Checklist

1. Step 02 shared core is explicitly unchanged
2. Step 03 family layer is explicitly unchanged
3. Step 04 adapter layer is explicitly unchanged
4. Step 05 registry integration is explicitly unchanged
5. first adoption for `magazine-domain`, `youtube-domain`, and `podcast-domain` is frozen
6. podcast family-backed adoption is frozen
7. SEC family-only pilot handling is frozen
8. Step 06 still does not enter real business migration

## Non-Goals

- no real source integration
- no real ingestion
- no real parser pipeline
- no page migration
- no existing business logic migration
- no SEC product domain
- no podcast product intelligence implementation
