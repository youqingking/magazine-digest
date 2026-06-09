# Shared Change Policy

## Purpose

Step 02 freezes the promotion rules that decide whether a capability belongs in shared packages or must remain domain-specific.

References:

- `docs/DOMAIN_SPLIT.md`
- `docs/SHARED_CANONICAL_MODELS.md`
- `docs/SHARED_MIGRATION_WAVES.md`

## A Capability May Promote From Domain To Shared Only When

1. it is reused or clearly required by at least 2 domains
2. its semantics are stable enough that both domains mean the same thing
3. it does not depend on one source type such as print packaging or video playback
4. it does not require domain-only ingestion knowledge
5. it does not force unnatural fields onto another domain
6. it can be expressed with content-type-agnostic naming
7. it can be validated through shared harness entrypoints

## A Capability Must Stay Domain-Specific When

1. it depends on source-native identity such as issue registry, channel identity, or playlist rules
2. it carries editorial, playback, transcript, or print-layout semantics
3. it needs ingestion or source-cleanup assumptions
4. it has not been exercised by at least one second domain or a credible second-domain adapter example
5. shared naming would become vague, awkward, or misleading

## Promotion Preconditions

Before promotion, all of the following must exist:

- a documented shared name
- domain-to-shared adapter mapping examples
- a frozen minimum field set
- explicit non-goals and domain-only leftovers
- a validation hook in shared harness or contract validation

## Premature Sharing

`premature sharing` means moving a concept into shared before its meaning is stable across domains.

Typical examples:

- promoting issue packaging rules just because the magazine app already has them
- promoting playback- or transcript-derived metadata before a second domain agrees on the same concept
- exposing domain-only field names as if they were platform truth

## Domain Leakage

`domain leakage` means shared contracts start carrying fields or names that only make sense for one domain.

Typical examples:

- shared package exports named after `article`, `publication`, `video`, or `channel`
- shared detail contracts requiring timestamp anchors or print spread metadata
- shared admin registries that assume one domain workflow

## Change Control Rules

- Step 02 changes are additive only
- no existing domain file moves are required for a policy freeze
- if a proposed shared field still feels domain-biased, keep it domain-specific and document the reason
- if two domains want similar behavior but different fields, freeze the shared seam and keep field mapping in adapters first

## Decision Shortcut

Ask these questions in order:

1. can magazine and YouTube both express this capability without awkward translation
2. is the name content-type-agnostic
3. can the shared package expose it without importing a domain workflow
4. can Step 02 validate the boundary without real infra

If any answer is no, the capability stays domain-specific for now.
