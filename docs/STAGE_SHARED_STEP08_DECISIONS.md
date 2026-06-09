# Stage Shared Step 08 Decisions

## Context

- Step 02 shared core remains authoritative
- Step 03 family layer remains authoritative
- Step 04 adapter layer remains authoritative
- Step 05 registry integration remains authoritative
- Step 06 first adoption remains authoritative
- Step 07 stable manifest and stable projection boundaries remain authoritative
- Step 08 is additive-only selected-domain second migration slice plus shared mobile/admin adoption planning

## Frozen Decisions

1. Step 08 does not modify Step 02 shared core
2. Step 08 does not modify Step 03 family layer
3. Step 08 does not rewrite Step 04 adapter layer
4. Step 08 does not rewrite Step 05 registry integration
5. Step 08 does not rewrite Step 06 first adoption
6. Step 08 does not rewrite Step 07 stable manifest or stable projection boundaries
7. Step 08 adds domain surface manifests as a second-layer contract above Step 07 domain manifests
8. Step 08 adds selected-domain second migration slice builders for mobile-facing and admin-facing shared surfaces only
9. Step 08 adds shared mobile/admin adoption planning only and still does not migrate real pages or workflows
10. podcast product intelligence is formally split into a separate future line starting from Step 08

## Surface Decisions

- selected domains must provide list, detail, discovery-card, and admin-preview builders
- surface builders may consume only stable projection, retained extras, and diagnostics
- retained extras may influence surface decisions but must not pollute shared canonical models
- inbox preview and manual rails remain planning-only in Step 08

## SEC Family-Only Pilot Decision

1. SEC continues to remain a family-only pilot
2. Step 08 does not create `sec-domain`
3. Step 08 does not create a SEC domain surface manifest
4. Step 08 does not create SEC mobile surface builders
5. Step 08 does not create SEC admin surface builders
6. SEC remains visible only in capability coverage and validator family-only checks

## Protected Snapshot Decision

- Step 08 validator must continue using hash-based protected snapshot verification
- Step 08 must verify Step 02, Step 03, Step 04, Step 05, Step 06, and Step 07 protected files remain unchanged
- Step 08 does not require an automatic commit to establish immutability

## Non-Goals

Step 08 does not do:

1. real source integration
2. real ingestion
3. product page migration
4. real admin workflow migration
5. SEC product-domain upgrade
6. YouTube retro-fit into transcript family
7. podcast product intelligence implementation

## Validation Decisions

- validator must check Step 08 docs, surface manifests, builders, contracts, and reports
- validator must check protected snapshot immutability for Step 02-07 files
- validator must reject page or workflow migration drift
- validator must reject podcast product intelligence leakage into Step 08 code paths
