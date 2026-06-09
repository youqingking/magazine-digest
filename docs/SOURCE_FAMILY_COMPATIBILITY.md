# Source Family Compatibility

## Purpose

This document explains how the new family layer relates to the current magazine and YouTube domain examples.

Shared core remains unchanged.

References:

- `docs/SHARED_MODEL_EXAMPLES.md`
- `docs/SOURCE_FAMILY_LAYER.md`
- `docs/SOURCE_FAMILY_PROMOTION_RULES.md`

## Magazine Compatibility

Magazine remains primarily:

- shared core
- magazine adapter

Reason:

- its central semantics are still `publication`, `issue`, `article`, editorial taxonomy, and print layout
- those semantics do not naturally fit any Step 03 family as a stable middle layer

Fields that may borrow family ideas later as sidecars, not as canonical identity:

- attribution and license snapshots for curated visual inserts
- official-record sidecar refs when an article summarizes a filing or official record

Fields that should not be retro-fit into family:

- `issue_id`
- `issue_label`
- `start_page`
- print section path
- publication taxonomy overrides

## YouTube Compatibility

YouTube remains primarily:

- shared core
- YouTube adapter

Reason:

- its central semantics are still `channel`, `video`, playback identity, and watch behavior
- those semantics are too source-specific to become family-level truth today

Fields that may later use family layer:

- transcript segments
- speaker turns
- timestamp ranges
- clip anchors
- transcript completeness snapshots

Fields that should not be retro-fit into family:

- `channel` identity as the canonical family source
- `video` playback state
- `watch-or-skip`
- `input quality tier`
- poster and thumbnail policy

## Compatibility Rule

Family layer is optional for a domain.

- if a domain already projects cleanly into shared core, it may keep using shared + adapter only
- if a domain has a reusable family-specific semantic cluster, it may add family mapping before shared projection

Step 03 does not require magazine or YouTube to re-route through family layer.
