# Step 02 Acceptance

## Goal

Step 02 is complete only when the shared contract freeze is documented, packaged as skeletons, and validated without touching business pages or real infra.

References:

- `docs/SHARED_CANONICAL_MODELS.md`
- `docs/SHARED_ENUMS_AND_KEYS.md`
- `docs/SHARED_PACKAGE_APIS.md`
- `docs/SHARED_MODEL_EXAMPLES.md`
- `docs/SHARED_CHANGE_POLICY.md`
- `docs/SHARED_MIGRATION_WAVES.md`
- `docs/STAGE_SHARED_STEP02_DECISIONS.md`

## Required Artifacts

- all Step 02 shared docs listed above
- five `attention-core-*` package skeletons with `package.json`, `README.md`, and `src/index.js`
- `scripts/contracts/validate-shared-step-02.mjs`
- `scripts/contracts/validate-shared-step-02.ps1`
- `output/shared-step-02/validation-report.json`

## Validation Commands

- `node scripts/contracts/validate-shared-step-02.mjs`
- `powershell -ExecutionPolicy Bypass -File scripts/contracts/validate-shared-step-02.ps1`

## Acceptance Checklist

1. shared canonical models are frozen and content-type-agnostic
2. shared enums, keys, and state vocabulary are frozen
3. five shared package public API boundaries are frozen in docs and package READMEs
4. magazine and YouTube mapping examples exist and explicitly leave domain-only fields outside shared canonical models
5. migration waves and promotion rules are frozen
6. validator runs and writes a machine-readable result
7. Step 02 introduces no real infra, credentials, business pages, or domain code moves

## Non-Goals

- no business page implementation
- no runtime rewrite
- no ingestion, PDF, web, transcript, or video processing
- no real remote/runtime credentials
- no collection rename or domain file move
