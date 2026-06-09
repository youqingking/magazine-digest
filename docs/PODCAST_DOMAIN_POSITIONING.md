# Podcast Domain Positioning

## Purpose

Step 05 freezes the boundary between transcript family semantics, podcast-domain semantics, and future podcast product intelligence.

References:

- `docs/SOURCE_FAMILY_MODELS.md`
- `docs/ROUTE_RESOLUTION_FLOW.md`
- `docs/DOMAIN_SKELETON_MIGRATION.md`

## Layer 1: Transcript Family Semantics

Transcript family owns:

- `segment`
- `speaker turn`
- `timestamp range`
- `clip anchor`
- transcript completeness and availability

These belong to `transcript_first_longform`, not to shared core and not to podcast product intelligence.

## Layer 2: Podcast-Domain Semantics

Podcast-domain owns:

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

These semantics justify a future product-domain seam, but Step 05 only creates a skeleton boundary for them.

## Layer 3: Out-Of-Scope Product Intelligence

The following are explicitly out of Step 05:

- `60s summary`
- `3min structured brief`
- `worth-listening signal`
- `cross-episode compare`
- `topic tracking`
- `Chinese restructuring`
- `reusable quote intelligence`

These do not enter:

- shared core
- family normalizer
- adapter runtime contracts
- Step 05 podcast domain skeleton code

## Step 05 Positioning Rule

`podcast-domain` is the future product-layer landing zone for podcast-specific product capabilities, but in Step 05 it remains only a selected domain skeleton.

It must connect through:

`podcast adapter -> transcript family -> shared core`

It must not bypass transcript family for transcript-native semantics.
