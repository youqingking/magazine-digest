# Step 08 Acceptance

## Goal

Step 08 is complete only when the selected-domain second migration slice and shared mobile/admin adoption planning are frozen without reopening Step 02 through Step 07 boundaries.

References:

- `docs/DOMAIN_SURFACE_MANIFESTS.md`
- `docs/MOBILE_UI_SURFACE_RULES.md`
- `docs/ADMIN_SURFACE_RULES.md`
- `docs/SHARED_MOBILE_ADOPTION_PLAN.md`
- `docs/SHARED_ADMIN_ADOPTION_PLAN.md`
- `docs/PODCAST_PRODUCT_INTELLIGENCE_SPLIT.md`
- `docs/STAGE_SHARED_STEP08_DECISIONS.md`

## Required Artifacts

- all Step 08 docs listed above
- core runtime surface-manifest and surface-projection files
- shared mobile-ui contract files
- shared admin contract files
- adapter harness surface-adoption report helpers
- selected-domain surface manifests and second migration slice builders
- `scripts/contracts/validate-shared-step-08.mjs`
- `scripts/contracts/validate-shared-step-08.ps1`
- `output/shared-step-08/validation-report.json`
- `output/shared-step-08/surface-adoption-report.json`
- `output/shared-step-08/mobile-admin-adoption-plan.json`

## Validation Commands

- `node scripts/contracts/validate-shared-step-08.mjs`
- `powershell -ExecutionPolicy Bypass -File scripts/contracts/validate-shared-step-08.ps1`

## Acceptance Checklist

1. Step 02 shared core is unchanged
2. Step 03 family layer is unchanged
3. Step 04 adapter layer is not overturned
4. Step 05 registry integration is not overturned
5. Step 06 first adoption is not overturned
6. Step 07 stable manifest and stable projection are not overturned
7. the second migration slice for `magazine`, `youtube`, and `podcast` is frozen
8. shared mobile adoption planning is frozen
9. shared admin adoption planning is frozen
10. podcast product line split is frozen
11. SEC remains family-only
12. Step 08 still does not enter real page migration or real admin workflow migration

## Non-Goals

- no real source integration
- no real ingestion
- no real product page migration
- no real admin workflow migration
- no SEC product-domain upgrade
- no podcast product intelligence implementation
