# Stage Shared Step 03 Decisions

## Context

- pre-Step 03 checkpoint: `f23ef9e`
- Step 02 shared core remains authoritative
- Step 03 is family-layer-only and additive

## Frozen Decisions

1. shared core is not modified in Step 03
2. family layer sits between shared core and source adapters
3. Step 03 freezes 5 source families only as contracts, docs, examples, and package skeletons
4. Step 03 package entrypoints remain JS-first `src/index.js`
5. Step 03 does not require magazine or YouTube to adopt family layer immediately
6. adapter -> family -> shared promotion path is now explicit

## Frozen Family Names

- `transcript_first_longform`
- `official_structured_sources`
- `knowledge_community_qa`
- `open_social_expert_stream`
- `visual_inspiration_curated_asset`

## Boundary Decisions

- transcript segment, speaker turn, filing revision, accepted answer, repost edge, and asset arrangement are family semantics, not shared-core semantics
- source-native ids, proprietary ranking logic, ingestion traces, and platform permission models remain adapter-only
- magazine issue semantics and YouTube playback semantics remain outside family by default

## Validation Decisions

- Step 03 validator checks docs, package skeletons, examples, and consistency with Step 02 boundaries
- Step 03 validator does not build the app or migrate domain code
