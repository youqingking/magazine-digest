# Stage Shared Step 07 Decisions

## Context

- Step 02 shared core remains authoritative
- Step 03 family layer remains authoritative
- Step 04 adapter layer remains authoritative
- Step 05 registry integration and selected-domain skeleton boundaries remain authoritative
- Step 06 first adoption remains authoritative
- Step 07 is additive-only manifest adoption and stable projection migration

## Frozen Decisions

1. Step 07 does not modify Step 02 shared core
2. Step 07 does not modify Step 03 family layer
3. Step 07 does not rewrite Step 04 adapter contracts, registry, or diagnostics rules
4. Step 07 does not rewrite Step 05 registry integration or selected-domain boundaries
5. Step 07 does not rewrite Step 06 first adoption boundaries
6. Step 07 freezes stable manifests for `magazine`, `youtube`, and `podcast`
7. Step 07 migrates only the first stable projection slice for those three selected domains
8. Step 07 adds retained extras builders, manifest-driven runtime adoption, and protected-path hash snapshots
9. `family-sec-filing` remains a family-only pilot with `no_domain_upgrade = true`

## Runtime Decisions

- manifest-driven adoption replaces hand-picked Step 06 execution as the new stable Step 07 path
- fixtures remain the only legal execution input
- direct domains remain direct
- family-backed domains remain family-backed
- stable projection modules stay small and deterministic

## Explicit Non-Goals

Step 07 does not do:

1. product page migration
2. business logic migration
3. ingestion migration
4. real source execution
5. YouTube retro-fit into transcript family
6. SEC promotion into a product domain
7. podcast product intelligence implementation
8. full domain migration

## Podcast Boundary Restatement

Podcast remains family-backed for transcript-native semantics and domain-owned for podcast semantics.

The following remain out of Step 07 code:

- `60s summary`
- `3min structured brief`
- `worth-listening signal`
- `cross-episode compare`
- `topic tracking`
- `Chinese restructuring`
- `reusable quote intelligence`

## Validation Decisions

- Step 07 validator must check docs, manifests, stable projection modules, manifest-driven runtime entrypoints, capability coverage, and protected snapshots
- Step 07 validator must reject page/business migration drift
- Step 07 validator must reject podcast product intelligence leakage into Step 07 code
