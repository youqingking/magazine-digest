# Adapter Routing Rules

## Purpose

Step 04 freezes when a source adapter should use direct path versus family path.

References:

- `docs/ADAPTER_LAYER.md`
- `docs/SOURCE_FAMILY_PROMOTION_RULES.md`
- `docs/SOURCE_FAMILY_COMPATIBILITY.md`
- `docs/PILOT_ADAPTER_SELECTION.md`

## Use Direct Path When

- source semantics are already close to Step 02 shared canonical models
- the source does not need a family layer to hold a reusable semantic cluster
- forcing the source into a family would overfit one source shape
- forcing the source into a family would leak domain semantics into a family that does not naturally own them
- the adapter can map straight into shared projection targets while safely retaining source-only extras

## Use Family Path When

- the source belongs to one of the frozen Step 03 source families
- the source has a cluster of family-level semantics reused by more than one source in that family
- those semantics are too specialized for shared core
- those semantics should not remain duplicated inside each single-source adapter forever
- the adapter still needs to preserve some source-native extras after family normalization

## Do Not Promote When

- the concept only holds for one source
- the concept depends on one platform or vendor internal rule
- the concept would pollute shared canonical naming
- the concept only creates premature abstraction

## Why Magazine Remains Direct Path First

Magazine currently remains primarily:

- magazine adapter
- shared core projection

Reason:

- its central semantics are still `publication`, `issue`, `article`, editorial taxonomy, and print layout
- those semantics do not fit any frozen Step 03 family as a stable middle layer
- forcing magazine through family would create a fake middle layer instead of reusable family truth

Magazine retained extras that stay adapter-side:

- `issue_id`
- `issue_label`
- `start_page`
- print taxonomy path and labels
- cover slot and print placement

## Why YouTube Remains Direct Path First

YouTube currently remains primarily:

- YouTube adapter
- shared core projection

Reason:

- its central semantics are still `channel`, `video`, playback identity, and watch behavior
- current summary projection already maps cleanly into shared list/detail shells
- forcing YouTube into transcript family today would retro-fit playback semantics into a transcript-first family that does not own them

YouTube retained extras that stay adapter-side:

- `timestamp_anchors`
- `watch_or_skip`
- `input_quality_tier`
- `duration_seconds`
- `playback_policy`

## Why Transcript-First Longform Fits Family Path Better

`transcript_first_longform` is a better family path when the source has reusable transcript-native semantics such as:

- transcript availability
- segment ordering
- speaker turns
- timestamp ranges
- transcript completeness

Those semantics are not shared-core-safe yet, but they are broader than a single source adapter.

## Why Official Structured Sources Fit Family Path Better

`official_structured_sources` is a better family path when the source has reusable structured-record semantics such as:

- record identity
- filing or notice status
- revision chains
- amendment relationships
- effective windows

Those semantics should not be pushed directly into shared core, but they are too reusable to remain forever trapped in a single filing adapter.

## Non-Promotable Counterexamples

The following are strong examples that must not promote beyond adapter in Step 04:

1. `issue_id` and `issue_label`
2. `watch_or_skip`
3. `input_quality_tier`
4. SEC accession formatting rules
5. parser trace ids
6. player deep-link fragments

## Route Freeze

- direct path and family path are both legal
- family path is optional, not mandatory
- magazine and YouTube are not forced to retro-fit into family layer
- transcript-first and official-structured pilots use family path because they have reusable family semantics
- route selection is a contract and diagnostics concern in Step 04, not a migration of current domain code
