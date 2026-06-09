# Step 03 Acceptance

## Goal

Step 03 is complete only when the family middle layer is documented, packaged as skeletons, and validated without changing Step 02 shared core boundaries.

References:

- `docs/SOURCE_FAMILY_LAYER.md`
- `docs/SOURCE_FAMILY_MODELS.md`
- `docs/SOURCE_FAMILY_ENUMS_AND_KEYS.md`
- `docs/SOURCE_FAMILY_PROMOTION_RULES.md`
- `docs/SOURCE_FAMILY_EXAMPLES.md`
- `docs/SOURCE_FAMILY_COMPATIBILITY.md`
- `docs/STAGE_SHARED_STEP03_DECISIONS.md`

## Required Artifacts

- all Step 03 family docs listed above
- `attention-family-contracts`, `attention-family-runtime`, and `attention-family-harness` package skeletons
- `scripts/contracts/validate-shared-step-03.mjs`
- `scripts/contracts/validate-shared-step-03.ps1`
- `output/shared-step-03/validation-report.json`

## Acceptance Checklist

1. Step 02 shared core is explicitly unchanged
2. shared core / family layer / source adapter boundaries are explicit
3. all 5 family contracts, enums, examples, and package surfaces are frozen
4. validator checks docs, package skeletons, examples, and consistency
5. no real source migration or infra integration is introduced

## Validation Commands

- `node scripts/contracts/validate-shared-step-03.mjs`
- `powershell -ExecutionPolicy Bypass -File scripts/contracts/validate-shared-step-03.ps1`
