# Selected Domain Adoption

## Purpose

Step 06 freezes the first shared runtime adoption path for the selected domains without turning this stage into real product migration.

References:

- `docs/PILOT_REGISTRY_INTEGRATION.md`
- `docs/ROUTE_RESOLUTION_FLOW.md`
- `docs/PODCAST_DOMAIN_POSITIONING.md`
- `docs/FAMILY_ONLY_PILOT_HANDLING.md`

## Step 06 Position

Step 06 is the first shared runtime adoption stage.

It proves that the previously frozen layers can now be executed as a minimal closed loop:

1. input fixture
2. route resolution
3. family normalization when required
4. shared projection
5. diagnostics

This is an executable skeleton, not a real product migration.

## Selected Domain Set

Only these selected domains participate in Step 06 adoption:

1. `magazine-domain`
2. `youtube-domain`
3. `podcast-domain`

`family-sec-filing` continues as a family-only pilot and does not become a product domain.

## Adoption Closure By Domain

### `magazine-domain`

- direct path only
- input fixture flows through shared runtime entry
- shared projection fixture and diagnostics fixture are emitted
- retained extras stay explicit:
  - `issue_id`
  - `issue_label`
  - `start_page`
  - `print_taxonomy_path`
  - `cover_slot`

### `youtube-domain`

- direct path only
- input fixture flows through shared runtime entry
- shared projection fixture and diagnostics fixture are emitted
- YouTube does not retro-fit into transcript family
- retained extras stay explicit:
  - `timestamp_anchors`
  - `watch_or_skip`
  - `input_quality_tier`
  - `duration_seconds`
  - `playback_policy`

### `podcast-domain`

- family-backed path only
- input fixture must resolve through `transcript_first_longform`
- family-normalized fixture is required
- shared projection fixture and diagnostics fixture are required
- retained extras are split explicitly into:
  - adapter-only extras
  - domain-only podcast semantics

## Podcast Boundary Restatement

Transcript family continues to own:

- `segment`
- `speaker_turn`
- `timestamp_range`
- `clip_anchor`
- `transcript_completeness`

Podcast domain continues to own:

- `show`
- `episode`
- `guest`
- `chapter`
- `feed`
- `episode_number`
- `season_number`
- `audio_source_url`
- `source_platform`
- `podcast_network`
- enclosure and feed metadata

The following remain out of Step 06:

- `60s summary`
- `3min structured brief`
- `worth-listening signal`
- `cross-episode compare`
- `topic tracking`
- `Chinese restructuring`
- `reusable quote intelligence`

## Step 06 Guardrails

- adoption must use the runtime layers already frozen in Steps 04 and 05
- adoption must stay fixture-driven
- adoption must not add page migration
- adoption must not add ingestion
- adoption must not add real source fetching
- adoption must not move existing business code
