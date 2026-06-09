# Shared Package APIs

## Purpose

Step 02 freezes the public API boundaries for the shared packages without starting large-scale migration.

Step 02 implementation note:

- the repo is currently JS-first, so package skeleton entrypoints use `src/index.js`
- TypeScript adoption can happen in a later wave without changing the frozen public surface names

References:

- `docs/SHARED_CANONICAL_MODELS.md`
- `docs/SHARED_ENUMS_AND_KEYS.md`
- `docs/SHARED_MIGRATION_WAVES.md`

## Dependency Direction

Allowed direction in Step 02:

1. `attention-core-contracts`
2. `attention-core-runtime`
3. `attention-core-mobile-ui`
4. `attention-core-admin`
5. `attention-core-harness`

Rules:

- `attention-core-contracts` depends on no other shared package
- `attention-core-runtime` may depend on `attention-core-contracts`
- `attention-core-mobile-ui` may depend on `attention-core-contracts`, but not on runtime implementations
- `attention-core-admin` may depend on `attention-core-contracts` and shared registry shapes, but not on business workflows
- `attention-core-harness` may read every package boundary for validation; no package should depend on harness

## `attention-core-contracts`

Responsible for:

- canonical model names
- shared enums and keys
- payload shapes
- schema contract names
- product-scoped alias rules

Not responsible for:

- domain mapping logic
- runtime service behavior
- page composition
- admin workflows

Public API:

- canonical model name registry
- shared enum name registry
- canonical key alias registry
- payload shape names
- schema contract family names

Should not expose:

- `article`, `publication`, `video`, `channel`, or `issue` as shared canonical exports
- adapter implementations
- runtime fetch clients

## `attention-core-runtime`

Responsible for:

- adapter interface names
- runtime mode contracts
- shared service seam names
- registry seams for runtime selection and cache/sync behavior

Not responsible for:

- magazine mapping implementations
- YouTube mapping implementations
- remote transport credentials
- page- or component-level UI

Public API:

- adapter interface registry
- runtime mode registry
- service seam registry
- runtime registry shape names
- runtime boundary metadata

Should not expose:

- domain adapters with actual source mapping logic
- domain storage schemas
- real infra configuration

## `attention-core-mobile-ui`

Responsible for:

- UI primitive names
- shared presentation contract names
- state panel vocabulary
- theme/shell boundary metadata

Not responsible for:

- business pages
- domain-specific page composition
- publication-only or channel-only cards

Public API:

- primitive component registry
- presentation contract registry
- state panel type registry
- shell boundary metadata

Should not expose:

- page route ownership
- issue-specific or video-specific render logic
- runtime fetch orchestration

## `attention-core-admin`

Responsible for:

- generated/manual admin track boundary contracts
- shared registry naming
- contract-map conventions

Not responsible for:

- magazine issue ops
- publication taxonomy override workflows
- channel/video domain workflows

Public API:

- generated rail registry names
- manual rail registry names
- contract-map registry names
- admin boundary metadata

Should not expose:

- domain workflow implementations
- source-specific moderation rules
- operator-only business policy logic

## `attention-core-harness`

Responsible for:

- validation entry names
- report shape names
- checkpoint and verification conventions
- package-boundary verification metadata

Not responsible for:

- domain smoke flows
- real build pipelines
- infra connectivity

Public API:

- validation entry registry
- report shape registry
- checkpoint convention registry
- harness boundary metadata

Should not expose:

- magazine-only fixtures
- YouTube-only smoke scenarios
- live service credentials
