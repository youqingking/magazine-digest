# Retained Extras Policy

## Purpose

Step 07 freezes retained extras as a legal runtime adoption output while keeping Step 02 shared canonical models closed to domain leakage.

References:

- `docs/ADAPTER_DIAGNOSTICS.md`
- `docs/DOMAIN_MANIFEST_SPEC.md`
- `docs/STABLE_PROJECTION_RULES.md`

## Core Rule

Retained extras are a valid output of domain/runtime adoption.

Retained extras are not:

- shared canonical models
- shared-core backfill
- a loophole for Step 02 contract expansion

## Required Groups

Step 07 retained extras must be split into at least two groups:

1. `adapter_only_extras`
2. `domain_only_extras`

## Group Meaning

### `adapter_only_extras`

These remain closest to source adapter ownership.

Examples:

- magazine print packaging carryovers when they are adapter-owned
- YouTube playback-side leftovers
- podcast transcript cue and provider traces

### `domain_only_extras`

These are selected-domain semantics that still do not promote into shared core.

Examples:

- magazine issue packaging fields
- YouTube playback policy and duration
- podcast show/feed/network semantics

## Podcast Explicit Rule

`podcast-domain` must explicitly split retained extras into both groups:

- adapter-only transcript leftovers:
  - `cue_id`
  - `provider_confidence_trace`
  - `player_deep_link_fragment`
  - `subtitle_track_id`
- domain-only podcast semantics:
  - `show_id`
  - `show_title`
  - `guest_names`
  - `chapter_titles`
  - `feed_url`
  - `episode_number`
  - `season_number`
  - `audio_source_url`
  - `source_platform`
  - `podcast_network`
  - `enclosure_url`

## Guardrails

- retained extras must stay explicit in diagnostics
- retained extras must not silently appear as shared-core fields later
- retained extras must not justify reopening Step 02 shared models
- retained extras must not be used as a backdoor for product intelligence
