# Stage Shared Step 05 Decisions

## Context

- pre-Step 05 checkpoint: `dc6a697`
- Step 02 shared core remains authoritative
- Step 03 family layer remains authoritative
- Step 04 adapter layer remains authoritative
- Step 05 is Wave 2 pilot registry integration plus selected domain skeleton work only

## Frozen Decisions

1. Step 05 does not modify Step 02 shared core
2. Step 05 does not modify Step 03 family layer
3. Step 05 does not rewrite Step 04 adapter layer
4. Step 05 integrates the four Step 04 pilots through registry, route resolver, and runtime surface metadata only
5. Step 05 adds selected domain skeletons for `magazine-domain`, `youtube-domain`, and `podcast-domain` only
6. `podcast-domain` is family-backed and must connect through `transcript_first_longform`
7. `family-sec-filing` remains a family pilot and does not become a product domain

## Non-Goals

Step 05 does not do:

1. real source fetching
2. real parser or importer work
3. page migration
4. large-scale domain migration
5. YouTube retro-fit into transcript family
6. SEC promotion into a product domain
7. podcast product intelligence inside shared, family, adapter, or selected domain code

## Boundary Decisions

- core runtime resolves shape flow only
- family runtime normalizers stop at family-normalized shape
- adapter runtime remains responsible for route declaration, registry entry, and diagnostics
- selected domain skeletons are metadata and mapper stubs only

## Validation Decisions

- Step 05 validator checks docs, route resolver, normalizers, pilot registry integration, domain skeletons, and protected file safety
- Step 05 validator checks that podcast intelligence terms are excluded from Step 05 code paths
- Step 05 validator does not execute real ingestion, builds, or domain migrations
