# Content Pipeline Handoff

## Purpose

Define the boundary between the external content pipeline and this Expo-first runtime repository.

## External Pipeline Owns

The external pipeline owns:

- Source acquisition.
- PDF parsing.
- Web scraping.
- Prompt generation.
- Markdown generation.
- Editorial workflow scheduling.
- Content normalization before handoff.
- Standardized content package production.
- Package provenance and release orchestration.

Those responsibilities stay outside this repository.

## Repo Owns

This repository owns:

- Content package contract docs.
- Runtime fixture contract docs.
- Runtime boundary docs.
- Synthetic fixture validation, build, export, and scenario selection scripts under `scripts/content/**`.
- Runtime-safe validation of standardized package shape.
- Mobile runtime fixture exports under `mobile/fixtures/runtime/**`.
- Future Expo-first app runtime behavior under `apps/mobile`.
- Future shared runtime contracts under `packages/core-*`.
- Future Supabase seam under `infra/supabase`.

This repository does not produce source content.

## Handoff Object

The external pipeline hands off standardized content packages and runtime metadata that include:

- Package identity.
- `product_key`.
- Publication identity.
- Article identity.
- Article variant identity.
- Language.
- Audience segment.
- Reading mode.
- Revision.
- Publish status.
- Publish time.
- Premium tier.
- Source kind.
- Content hash or equivalent integrity evidence.
- Fallback policy.
- Update metadata.
- Tombstone or delete semantics.
- Runtime metadata needed by config, entitlement, experiment, pricing, notification, and event surfaces.

## Runtime Can Assume

After package validation succeeds, the runtime can safely assume:

- Required identifiers are present.
- `product_key` is explicit.
- Publication, article, and variant keys are stable within the package.
- Variant selection fields are present.
- Availability state is represented through publish status, publish time, availability windows, and tombstones.
- Premium tier is metadata for entitlement checks, not an entitlement grant.
- Pricing, quota, feature flag, experiment, campaign, promo, referral, and entitlement facts are previews or external snapshots, not client-side authority.
- Content body and metadata are already normalized by the external pipeline or synthetic fixture source.

## Runtime Must Verify

The runtime must verify:

- Required fields exist before accepting a package.
- Product scoping is consistent.
- Package and variant revision clocks are explicit.
- Tombstones target known package identities or carry enough identity to hide content safely.
- Fallback does not expose adult-only content to teen or general audiences.
- Deleted, unpublished, future, or expired content is unavailable.
- Generated mobile fixture output is derived from current canonical inputs.

## Runtime Must Not Assume

The runtime must not assume:

- A missing `product_key` can be filled with a production default.
- Package metadata can grant subscription access.
- Package metadata can hardcode client prices, free quotas, benefits, feature flags, experiments, operational thresholds, or risk thresholds.
- The app repo can parse PDF, scrape web pages, generate prompts, generate markdown, or schedule content production.
- Legacy `mobile/`, `uniCloud/`, or `admin/` paths are the future source of runtime truth.

## Current Synthetic Handoff

The current no-credential handoff is synthetic:

- Source: `fixtures/test-inputs/**`.
- Build: `npm.cmd run build:test-inputs`.
- Validate: `npm.cmd run validate:test-inputs`.
- Export: `npm.cmd run export:runtime-scenarios`.
- Select: `npm.cmd run select:runtime-scenario -- -ScenarioId <scenario_id>`.
- Generated runtime output: `output/test-input-pack/**`.
- Mobile runtime fixtures: `mobile/fixtures/runtime/**`.

Synthetic handoff data proves runtime shape and risks. It is not a production content pipeline.

## Failure Modes

Contract freeze work must guard against:

- Boundary collapse into in-repo ingestion or generation.
- Missing or inconsistent `product_key`.
- Treating generated fixture output as source truth.
- Treating premium tier as entitlement authority.
- Treating pricing previews as store or RevenueCat authority.
- Changing fixture data content to make docs pass.
- Reactivating legacy runtime behavior without an explicit future goal.
