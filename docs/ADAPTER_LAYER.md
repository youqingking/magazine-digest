# Adapter Layer

## Purpose

Step 04 freezes the adapter layer that sits on top of the Step 02 shared core and alongside the optional Step 03 family middle layer.

Step 04 rules:

- additive only
- Step 02 shared core remains unchanged
- Step 03 family layer remains unchanged
- no domain file moves
- no real source integration
- no ingestion or infra work

References:

- `docs/SHARED_CANONICAL_MODELS.md`
- `docs/SOURCE_FAMILY_LAYER.md`
- `docs/ADAPTER_ROUTING_RULES.md`
- `docs/ADAPTER_REGISTRY.md`
- `docs/ADAPTER_DIAGNOSTICS.md`

## Frozen Three-Layer Boundary

### Layer 1: Shared Core

Shared core keeps the long-lived cross-domain contracts already frozen in Step 02.

Examples:

- `ContentRef`
- `ContentVariantKey`
- `ContentListItem`
- `ContentDetailEnvelope`
- `UserContentState`
- `EntitlementSnapshot`

### Layer 2: Source Family

Source family is an optional middle layer already frozen in Step 03.

It is used only when a source belongs to a family with reusable family semantics that are:

- broader than one source
- narrower than shared core
- still meaningful before shared projection

Family layer is a middle layer, not a mandatory layer.

### Layer 3: Source Adapter

Source adapter always owns single-source semantics.

Source adapter keeps:

- source-native ids
- source-native lifecycle quirks
- source-native ranking, packaging, or moderation rules
- source-native fetch assumptions
- source-native extras that do not promote cleanly

Source adapter never stops owning single-source semantics even when a family path is used.

## Two Legal Adapter Paths

### Direct Path

`source adapter -> shared core`

Use direct path when the source already projects cleanly into the Step 02 shared canonical models and a family middle layer would add forced abstraction instead of useful reuse.

Current direct-path-first examples:

- magazine summary projections
- YouTube summary projections

### Family Path

`source adapter -> source family -> shared core`

Use family path when a source belongs to an already frozen family and the source has a reusable family semantic cluster that should not be promoted directly into shared core.

Current family-path pilot examples:

- podcast transcript through `transcript_first_longform`
- SEC filing through `official_structured_sources`

## Adapter Responsibility Freeze

The adapter layer is for mapping and diagnostics.

The adapter layer is for:

- mapping source-side shapes into shared or family contracts
- documenting retained extras
- producing mapping diagnostics for architecture and migration work
- freezing route and registry metadata

The adapter layer is not for:

- source crawling or ingestion
- PDF parsing, transcript generation, or parser pipelines
- infra setup
- domain workflow rewrites
- replacing shared core or family core

## Compatibility Freeze

- not every source must pass through family layer
- family layer is optional, not mandatory
- magazine and YouTube remain valid shared-plus-adapter routes
- Step 04 does not force current domains to re-model around family contracts
- Step 04 does not move any existing domain code
