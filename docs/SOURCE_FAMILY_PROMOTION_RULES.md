# Source Family Promotion Rules

## Purpose

Step 03 freezes the promotion path between source adapters, family layer, and shared core.

References:

- `docs/SHARED_CHANGE_POLICY.md`
- `docs/SOURCE_FAMILY_LAYER.md`
- `docs/SOURCE_FAMILY_COMPATIBILITY.md`

## Adapter -> Family Promotion Conditions

A source-specific field or model may promote into family only when:

1. it is natural for at least 2 sources inside the same family
2. it can be named without using one source's proprietary terminology
3. it does not require source-specific ingestion traces to stay meaningful
4. it is useful before projection into shared core
5. it does not force unrelated families to adopt the same concept

## Family -> Shared Promotion Conditions

A family field or model may promote into shared only when:

1. it is now natural across at least 2 different families
2. it remains meaningful after removing family-specific context
3. it does not weaken the Step 02 shared core naming rule
4. it can be validated with shared-core examples, not only family examples
5. it does not force magazine, YouTube, or future families into unnatural shapes

## Must Stay In Adapter

These are strong adapter-only examples:

- ASR vendor confidence traces
- SEC accession formatting rules
- Stack Exchange reputation side effects
- Bluesky federation uri details
- Reddit subreddit-specific moderation reasons
- Pinterest pin graph internals

## May Stay In Family But Must Not Promote To Shared Yet

These are strong family-level examples:

- transcript segment ordering
- speaker turns
- filing amendment chains
- accepted-answer semantics
- repost / quote edge semantics
- attribution and license class

## Candidate Future Shared Promotions

These are not promoted now, but could become future shared candidates if multiple families need them:

- normalized revision chain summary
- normalized source-attribution snapshot
- normalized moderation visibility summary
- normalized freshness snapshot

## Non-Promotable Counterexamples

The following should not be promoted beyond their current layer:

- `timestamp anchors` directly into shared core
- `watch-or-skip` into shared core
- `input quality tier` into shared core
- `accepted answer` into shared core without broader family proof
- `repost_count` or source-native virality scores into shared core
- platform-specific license text into shared core

## Review Questions

Before approving any promotion:

1. is this source-specific, family-specific, or genuinely cross-family
2. does magazine need this naturally today
3. does YouTube need this naturally today
4. would the shared core become less content-type-agnostic after promotion

If the answer to question 4 is yes, do not promote.
