# Step 04 Acceptance

## Goal

Step 04 is complete only when the adapter layer is documented, packaged as skeletons, and validated without changing Step 02 shared core or Step 03 family layer.

References:

- `docs/ADAPTER_LAYER.md`
- `docs/ADAPTER_ROUTING_RULES.md`
- `docs/ADAPTER_REGISTRY.md`
- `docs/ADAPTER_DIAGNOSTICS.md`
- `docs/PILOT_ADAPTER_SELECTION.md`
- `docs/PILOT_MAPPING_EXAMPLES.md`
- `docs/STAGE_SHARED_STEP04_DECISIONS.md`

## Required Artifacts

- all Step 04 docs listed above
- `packages/attention-adapter-runtime` skeleton
- `packages/attention-adapter-harness` skeleton
- four pilot adapter stub files
- `scripts/contracts/validate-shared-step-04.mjs`
- `scripts/contracts/validate-shared-step-04.ps1`
- `output/shared-step-04/validation-report.json`

## Validation Commands

- `node scripts/contracts/validate-shared-step-04.mjs`
- `powershell -ExecutionPolicy Bypass -File scripts/contracts/validate-shared-step-04.ps1`

## Acceptance Checklist

1. Step 02 shared core is explicitly unchanged
2. Step 03 family layer is explicitly unchanged
3. adapter layer boundary is defined clearly
4. direct path and family path are frozen as the two legal routes
5. four pilot adapter skeletons are frozen
6. registry shape, diagnostics shape, and validation entry are frozen
7. Step 04 still does not enter real domain migration

## Non-Goals

- no real source integration
- no ingestion pipeline work
- no infra setup
- no shared core rewrite
- no family layer rewrite
- no large-scale domain migration
