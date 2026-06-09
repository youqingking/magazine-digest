# Step 05 Acceptance

## Goal

Step 05 is complete only when Wave 2 pilot registry integration and selected domain skeletons are frozen without modifying Step 02, Step 03, or Step 04 boundaries.

References:

- `docs/PILOT_REGISTRY_INTEGRATION.md`
- `docs/ROUTE_RESOLUTION_FLOW.md`
- `docs/DOMAIN_SKELETON_MIGRATION.md`
- `docs/DOMAIN_PILOT_SELECTION.md`
- `docs/PODCAST_DOMAIN_POSITIONING.md`
- `docs/STAGE_SHARED_STEP05_DECISIONS.md`

## Required Artifacts

- all Step 05 docs listed above
- core runtime route-resolution skeleton files
- family runtime normalizer skeleton files
- adapter runtime pilot integration helper files
- adapter harness route and pilot registry report files
- selected domain skeletons for `magazine-domain`, `youtube-domain`, and `podcast-domain`
- `scripts/contracts/validate-shared-step-05.mjs`
- `scripts/contracts/validate-shared-step-05.ps1`
- `output/shared-step-05/validation-report.json`

## Validation Commands

- `node scripts/contracts/validate-shared-step-05.mjs`
- `powershell -ExecutionPolicy Bypass -File scripts/contracts/validate-shared-step-05.ps1`

## Acceptance Checklist

1. Step 02 shared core is explicitly unchanged
2. Step 03 family layer is explicitly unchanged
3. Step 04 adapter layer is explicitly unchanged
4. route resolver is frozen
5. family normalizer skeletons are frozen
6. pilot registry integration is frozen
7. selected domain skeletons for magazine, YouTube, and podcast are frozen
8. podcast-domain boundary is frozen
9. Step 05 still does not enter real business migration

## Non-Goals

- no real source integration
- no real parser or importer
- no page migration
- no large-scale domain migration
- no SEC product domain
- no podcast product intelligence implementation
