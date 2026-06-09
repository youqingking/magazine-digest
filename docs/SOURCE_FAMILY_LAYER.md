# Source Family Layer

## Purpose

Step 03 adds a source-family middle layer above the Step 02 shared core and below source adapters.

Step 03 rules:

- additive only
- Step 02 shared core remains unchanged
- no large-scale migration
- no real new-source integration
- no domain file moves

References:

- `docs/SHARED_CANONICAL_MODELS.md`
- `docs/SHARED_ENUMS_AND_KEYS.md`
- `docs/SHARED_PACKAGE_APIS.md`
- `docs/STAGE_SHARED_STEP02_DECISIONS.md`

## Three-Layer Boundary

### Layer 1: Shared Core

Shared core keeps only long-lived cross-source semantics that still hold after source-specific and family-specific details are stripped away.

Examples:

- `ContentRef`
- `ContentVariantKey`
- `ContentListItem`
- `ContentDetailEnvelope`
- `UserContentState`
- `EntitlementSnapshot`

Shared core must not absorb family-only nouns such as transcript segment, filing amendment, accepted answer, repost edge, or board arrangement.

### Layer 2: Source Family Layer

Source family layer carries semantics shared by a broad source family but still too specialized for shared core.

It exists to prevent two bad outcomes:

1. forcing shared core to learn family-specific semantics
2. duplicating the same family semantics across many source adapters

### Layer 3: Source Adapter Layer

Source adapters keep single-source logic:

- source-native ids
- source-native lifecycle quirks
- source-native ranking and moderation rules
- source-native ingestion assumptions
- source-native fetch and normalization rules

## Dependency Flow

Conceptual dependency:

1. `attention-core-*`
2. `attention-family-*`
3. source adapters

Rules:

- family contracts may reference shared core contracts
- family runtime seams may reference shared core seams and family contracts
- source adapters may depend on family and core layers
- shared core must not depend on family layer

## Step 03 Package Layout

- `attention-family-contracts`: frozen family names, models, enums, keys, and promotion guardrails
- `attention-family-runtime`: frozen family projection seams and adapter bridge names
- `attention-family-harness`: frozen family validation entry names and consistency rules

## Frozen Family Set

Step 03 freezes these family names:

1. `transcript_first_longform`
2. `official_structured_sources`
3. `knowledge_community_qa`
4. `open_social_expert_stream`
5. `visual_inspiration_curated_asset`

## What Family Layer Is For

- transcript families: segment, speaker turn, timestamp range, clip anchor, transcript completeness
- official structured families: record, filing, revision, delta, effective date
- Q&A families: thread, answer, accepted answer, score, moderation state
- open social families: post, reply tree, repost, quote, watchlist freshness
- curated asset families: asset, collection, attribution, license, arrangement

## What Family Layer Is Not For

- Step 02 shared core replacements
- single-source adapter quirks
- business-page composition
- infra connectivity
- ingestion pipelines

## Family Promotion Boundary

Promotion path is now explicitly two-step:

1. adapter -> family
2. family -> shared

If a field is only natural for one source, it stays in the adapter.
If a field is natural for many sources in one family but awkward outside that family, it belongs in family.
If a field is natural across families and domains, it may later promote to shared core.
