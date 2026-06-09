# Family Only Pilot Handling

## Purpose

Step 06 freezes how family-only pilots continue to participate in validation without being upgraded into product domains.

References:

- `docs/SELECTED_DOMAIN_ADOPTION.md`
- `docs/PODCAST_DOMAIN_POSITIONING.md`

## Current Family-Only Pilot

Step 06 continues to carry:

- `family-sec-filing`

It remains a family-only pilot.

## Required Validation Path

`family-sec-filing` must still be able to run through:

1. route resolution
2. `official_structured_sources` normalizer
3. shared projection
4. diagnostics

## Explicit Non-Upgrade Rule

Step 06 does not create:

- `sec-domain`
- SEC product-domain package
- SEC page migration
- SEC business logic migration

The pilot remains a family-only executable validation asset.

## Output Rule

Step 06 writes a family-only validation artifact:

- `output/shared-step-06/family-sec-filing.report.json`

That report must carry:

- route and family metadata
- shared projection snapshot
- diagnostics snapshot
- `no_domain_upgrade = true`
