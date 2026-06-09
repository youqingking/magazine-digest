# Stable Projection Rules

## Purpose

Step 07 promotes Step 06 one-off adoption execution into stable projection modules without expanding into business migration.

References:

- `docs/SELECTED_DOMAIN_ADOPTION.md`
- `docs/DOMAIN_MANIFEST_SPEC.md`
- `docs/PODCAST_DOMAIN_POSITIONING.md`

## Stable Projection Scope

Each selected domain must freeze three stable modules:

1. shared projection module
2. retained extras builder
3. diagnostics builder

Step 07 stable modules may handle only:

- input -> shared projection
- retained extras
- diagnostics

They must not start:

- product page migration
- business logic migration
- search/runtime product behavior migration
- live source execution
- ingestion

## Invocation Rule

Stable projection modules must be called by manifest-driven adoption.

They must not remain trapped in one-off validation scripts.

## Direct Domains

`magazine` and `youtube` continue to use direct path:

- `source adapter -> shared core`

Step 07 does not introduce fake family middle layers for these domains.

## Podcast Boundary

`podcast-domain` stable projection remains family-backed:

- `source adapter -> transcript_first_longform -> shared core`

Podcast stable projection code may cover only:

- family-backed domain adoption
- domain semantics:
  - `show`
  - `episode`
  - `guest`
  - `chapter`
  - `feed`
  - `season_number`
  - `episode_number`
  - `source_platform`
  - `podcast_network`

Transcript family continues to cover only:

- `segment`
- `speaker_turn`
- `timestamp_range`
- `clip_anchor`
- `transcript_completeness`

The following remain explicitly out of Step 07 code:

- `60s summary`
- `3min structured brief`
- `worth-listening signal`
- `cross-episode compare`
- `topic tracking`
- `Chinese restructuring`
- `reusable quote intelligence`

These terms may appear in Step 07 boundary docs as non-goals, but they must not enter Step 07 manifest runtime fields, stable projection outputs, or diagnostics payloads.
