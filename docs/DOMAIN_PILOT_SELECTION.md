# Domain Pilot Selection

## Purpose

Step 05 freezes which pilots are integrated into registry resolution only, and which pilots also receive a selected domain skeleton.

References:

- `docs/PILOT_ADAPTER_SELECTION.md`
- `docs/DOMAIN_SKELETON_MIGRATION.md`

## Registry-Integrated Pilots

All Step 04 pilots are integrated into the Step 05 pilot registry:

1. `direct-magazine-summary`
2. `direct-youtube-summary`
3. `family-podcast-transcript`
4. `family-sec-filing`

## Selected Domain Skeletons

The following pilots also receive a selected domain skeleton:

| Domain | Pilot | Route |
| --- | --- | --- |
| `magazine-domain` | `direct-magazine-summary` | direct |
| `youtube-domain` | `direct-youtube-summary` | direct |
| `podcast-domain` | `family-podcast-transcript` | family |

## Pilot Without Selected Domain Skeleton

`family-sec-filing` remains registry-integrated but does not become a selected product domain in Step 05.

## Selection Guardrails

- no additional product domains are introduced
- no SEC product domain is introduced
- no domain skeleton bypasses adapter registry
- `podcast-domain` must stay family-backed in Step 05
