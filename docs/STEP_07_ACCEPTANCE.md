# Step 07 Acceptance

## Goal

Step 07 is complete only when selected-domain adoption becomes manifest-driven, the first stable projection slice is frozen for the three selected domains, and protected-path snapshot policy is established without reopening Step 02 to Step 06 boundaries.

References:

- `docs/DOMAIN_MANIFEST_SPEC.md`
- `docs/DOMAIN_CAPABILITY_MATRIX.md`
- `docs/STABLE_PROJECTION_RULES.md`
- `docs/RETAINED_EXTRAS_POLICY.md`
- `docs/PROTECTED_PATH_SNAPSHOT_POLICY.md`
- `docs/STAGE_SHARED_STEP07_DECISIONS.md`

## Required Artifacts

- all Step 07 docs listed above
- manifest-driven core runtime entry files
- adapter-runtime manifest helper files
- adapter-harness capability and protected snapshot report helpers
- stable manifest files for `magazine`, `youtube`, and `podcast`
- stable projection, retained extras, and diagnostics modules for all three selected domains
- `scripts/contracts/validate-shared-step-07.mjs`
- `scripts/contracts/validate-shared-step-07.ps1`
- `output/shared-step-07/protected-paths.snapshot.json`
- `output/shared-step-07/validation-report.json`
- `output/shared-step-07/domain-capability-report.json`

## Validation Commands

- `node scripts/contracts/validate-shared-step-07.mjs`
- `powershell -ExecutionPolicy Bypass -File scripts/contracts/validate-shared-step-07.ps1`

## Acceptance Checklist

1. Step 02 shared core is unchanged
2. Step 03 family layer is unchanged
3. Step 04 adapter layer is not overturned
4. Step 05 registry integration is not overturned
5. Step 06 first adoption boundaries are not overturned
6. stable manifests for `magazine`, `youtube`, and `podcast` are frozen
7. first stable projection migration for `magazine`, `youtube`, and `podcast` is frozen
8. retained extras policy is frozen
9. protected snapshot policy is established
10. Step 07 still does not enter real business migration
