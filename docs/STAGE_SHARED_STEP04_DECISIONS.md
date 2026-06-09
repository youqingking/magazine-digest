# Stage Shared Step 04 Decisions

## Context

- pre-Step 04 checkpoint: `dc6a697`
- Step 02 shared core remains authoritative
- Step 03 family layer remains authoritative
- Step 04 is adapter-layer-only and additive

## Frozen Decisions

1. Step 04 does not modify Step 02 shared canonical models
2. Step 04 does not modify Step 03 family contracts
3. adapter layer freezes route contracts, registry shape, diagnostics shape, and pilot mapping skeletons only
4. Step 04 package entrypoints remain JS-first `src/index.js`
5. direct path and family path are both legal adapter routes
6. family layer remains optional, not mandatory
7. magazine and YouTube remain direct-path-first and are not forced to retro-fit into family layer
8. transcript-first and official-structured pilots use family path because they have reusable family semantics that still do not belong in shared core
9. Step 04 does not introduce real source fetch, real ingestion, real infra, or large-scale domain migration

## Boundary Decisions

- source adapters always keep single-source semantics
- adapter layer is for mapping and diagnostics, not pipeline work
- retained extras must stay explicit in diagnostics and pilot examples
- registry freezes metadata shape only, not live routing execution
- diagnostics are architecture and migration artifacts, not end-user surfaces

## Compatibility Decisions

- magazine direct path remains primary because issue and print packaging semantics do not fit a frozen family
- YouTube direct path remains primary because playback semantics do not belong to transcript family
- transcript-related YouTube sidecars may use family later without rewriting canonical YouTube identity
- family layer does not require current domain code to move or re-model

## Validation Decisions

- Step 04 validator checks docs, package skeletons, pilot files, route coverage, diagnostics consistency, and naming guardrails
- Step 04 validator checks that protected Step 02 and Step 03 files are unchanged
- Step 04 validator does not run app builds, live source verification, or migration execution
