# Stage Shared Step 02 Decisions

## Context

- Step 01 boundary freeze remains authoritative
- incoming checkpoint before Step 02: `07ca433`
- Step 02 is contract-first and additive only

## Frozen Decisions

1. shared canonical names stay content-type-agnostic
2. magazine and future YouTube integration must happen through adapters, not shared-domain renames
3. Step 02 creates docs, package skeletons, and validation only
4. Step 02 package entrypoints are JS-first `src/index.js` skeletons because the current repo is JS-heavy
5. real infra, real credentials, business pages, ingestion logic, and domain file moves remain out of scope
6. publish/runtime/commercial/discovery vocabulary must stay aligned with Stage B, F0, F1, G, and H0 decisions
7. Step 02 stops at Wave 1 plus partial Wave 2 skeleton metadata

## Canonical Naming Decisions

- shared source noun: `content_source`
- shared content noun: `content_item`
- shared variant noun: `content_variant`
- shared release noun: `release_batch`
- shared follow noun: `follow_target`

Legacy magazine names remain valid inside domain storage and adapters:

- `publication`
- `article`
- `article_variant`
- `publish_batch`

## Domain-Specific Holdbacks

These stay outside shared canonical models in Step 02:

- issue registry semantics
- publication editorial taxonomy rules
- timestamp anchors
- watch-or-skip
- input quality tier
- playback-specific metadata

## Validation Decisions

- Step 02 validator checks docs, package skeletons, README boundaries, exported public surfaces, cross-document consistency, naming pollution, and obvious credential leakage
- Step 02 validator does not run a full app build or modify existing verify behavior

## Next-Stage Gate

Step 03 may start only after:

- Step 02 validator is green
- Step 02 artifacts remain additive-only
- migration work is still limited to Wave 1 migration skeletons and approved Wave 2 seam introductions
