# Stage Shared Step 06 Decisions

## Context

- Step 02 shared core remains authoritative
- Step 03 family layer remains authoritative
- Step 04 adapter layer remains authoritative
- Step 05 registry, route resolution skeleton, and selected domain skeleton boundaries remain authoritative
- Step 06 is first adoption only

## Frozen Decisions

1. Step 06 does not modify Step 02 shared core
2. Step 06 does not modify Step 03 family layer
3. Step 06 does not rewrite Step 04 adapter contracts, registry, or diagnostics rules
4. Step 06 does not rewrite Step 05 registry integration or selected domain boundaries
5. Step 06 makes `magazine-domain`, `youtube-domain`, and `podcast-domain` executable through fixture-driven runtime adoption
6. `podcast-domain` must run through `transcript_first_longform`
7. `family-sec-filing` remains family-only and does not become a product domain

## Boundary Restatement

Transcript family still owns:

- `segment`
- `speaker_turn`
- `timestamp_range`
- `clip_anchor`
- `transcript_completeness`

Podcast domain still owns:

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

The following still do not enter Step 06 code:

- `60s summary`
- `3min structured brief`
- `worth-listening signal`
- `cross-episode compare`
- `topic tracking`
- `Chinese restructuring`
- `reusable quote intelligence`

## Non-Goals

Step 06 does not do:

1. real source fetching
2. real ingestion
3. real parser or importer work
4. product page migration
5. existing business logic migration
6. YouTube retro-fit into transcript family
7. SEC promotion into product domain
8. podcast product intelligence implementation

## Validation Decisions

- validator must execute the selected-domain adoption path
- validator must verify the family-only SEC path still runs
- validator must verify protected Step 02 to Step 05 tracked files remain unchanged
- validator must reject podcast product intelligence leakage into Step 06 code
