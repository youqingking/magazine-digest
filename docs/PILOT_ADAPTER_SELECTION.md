# Pilot Adapter Selection

## Purpose

Step 04 freezes a minimal pilot set that covers both legal adapter routes without forcing current domains into premature migration.

References:

- `docs/ADAPTER_ROUTING_RULES.md`
- `docs/PILOT_MAPPING_EXAMPLES.md`
- `docs/SOURCE_FAMILY_COMPATIBILITY.md`

## Selection Goals

- cover both `direct` and `family` route types
- prove adapter layer can sit above Step 02 and Step 03 without changing either one
- keep pilots additive-only
- avoid real source integration
- avoid large-scale domain migration

## Frozen Pilot Set

| Pilot | Route | Why selected |
| --- | --- | --- |
| `direct-magazine-summary` | direct | proves magazine can stay shared-plus-adapter without fake family retro-fit |
| `direct-youtube-summary` | direct | proves YouTube summary projection can stay direct while transcript-related semantics remain optional sidecars |
| `family-podcast-transcript` | family | proves transcript-native semantics normalize well through `transcript_first_longform` before shared projection |
| `family-sec-filing` | family | proves official structured record semantics normalize well through `official_structured_sources` before shared projection |

## Selection Guardrails

- these pilots are mapping skeletons only
- these pilots do not fetch live data
- these pilots do not replace domain storage
- these pilots do not move existing domain code
- these pilots do not force magazine or YouTube into family layer

## Why These Pilots Are Enough For Step 04

This set gives Step 04:

- one print-like direct route
- one video-summary direct route
- one transcript-family route
- one official-structured-family route

That is enough to freeze:

- adapter route contracts
- route selection rules
- registry metadata
- diagnostics metadata
- pilot mapping documentation
