# Domain Capability Matrix

## Purpose

Step 07 freezes the selected-domain capability matrix used by manifest-driven runtime adoption and validator coverage.

References:

- `docs/DOMAIN_MANIFEST_SPEC.md`
- `docs/STABLE_PROJECTION_RULES.md`
- `docs/FAMILY_ONLY_PILOT_HANDLING.md`

## Selected Domains

| Domain | route_type | family_kind | shared_projection_ready | retained_extras_ready | diagnostics_ready | stable_manifest_ready | product_intelligence_deferred | ui_migration_started | ingestion_started |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `magazine` | `direct` | `null` | `true` | `true` | `true` | `true` | `true` | `false` | `false` |
| `youtube` | `direct` | `null` | `true` | `true` | `true` | `true` | `true` | `false` | `false` |
| `podcast` | `family` | `transcript_first_longform` | `true` | `true` | `true` | `true` | `true` | `false` | `false` |

## Coverage Freeze

Step 07 capability coverage must remain at least:

- direct domains: `>= 2`
- family-backed domains: `>= 1`
- family-only pilots: `>= 1`

## Family-Only Pilot

`family-sec-filing` remains outside selected-domain upgrade.

Frozen handling:

- family-only pilot: `true`
- route_type: `family`
- family_kind: `official_structured_sources`
- shared_projection_ready: `true`
- diagnostics_ready: `true`
- stable_manifest_ready: `false`
- no_domain_upgrade: `true`

## No Domain Upgrade Rule

Step 07 keeps the SEC pilot at family-only validation scope:

- `no_domain_upgrade = true`
- no `sec-domain`
- no SEC product page migration
- no SEC business logic migration
