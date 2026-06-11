# Content Package Contract

## Purpose

Freeze the input object that the Magazine Digest runtime consumes from the external content pipeline.

This repository consumes standardized content packages and runtime metadata. It does not own source acquisition, PDF parsing, web scraping, prompt generation, markdown generation, package production orchestration, or pipeline scheduling.

## Source Of Truth

Current synthetic source inputs live under:

- `fixtures/test-inputs/manifests/test-pack.manifest.json`
- `fixtures/test-inputs/manifests/scenario-index.json`
- `fixtures/test-inputs/publications/publications.json`
- `fixtures/test-inputs/scenarios/*/scenario.meta.json`
- `fixtures/test-inputs/scenarios/*/*.md`
- `fixtures/test-inputs/scenarios/*/expected-outcomes.json`

Current source-of-truth scripts are:

- `scripts/content/validate-synthetic-test-pack.mjs`
- `scripts/content/build-synthetic-test-pack.mjs`
- `scripts/content/export-runtime-scenarios.mjs`
- `scripts/content/select-runtime-scenario.mjs`
- `scripts/content/synthetic-test-pack-lib.mjs`

Docs may clarify this contract, but they must not silently replace those scripts as the executable source of truth.

## Package Identity

A standardized package must carry stable identity and release metadata:

| Field | Required | Meaning |
| --- | --- | --- |
| `package_id` or `pack_id` | yes | Stable package identifier for the package release or synthetic pack. |
| `product_key` | yes | First-class product scope for package content, runtime config, events, entitlements, pricing previews, experiments, notifications, and fixtures. |
| `revision_id` or `revision` | yes | Revision clock for package or article variant updates. |
| `released_at` or `publish_at` | yes | Release or publication time used by runtime availability checks. |
| `content_hash` | yes for article variants | Integrity evidence for rendered body content. Current synthetic fixtures compute it from markdown body content. |
| `source_kind` | yes | Provenance family. Current synthetic markdown variants use `synthetic`; exported bundles use `synthetic_test_pack`. |

The runtime must not infer a production `product_key` silently. Local fixture defaults are allowed only as explicit synthetic or no-credential harness data.

## Publication

Each package must provide publication identity before article records are consumed.

Required publication dimensions:

- `publication_id` when available.
- `publication_key` as the stable cross-package publication key.
- Display metadata such as name and description when needed by runtime surfaces.
- `product_key` by direct field or package scope.

`fixtures/test-inputs/publications/publications.json` is the current canonical publication catalog for synthetic tests.

## Article

An article is the stable content item that owns one or more runtime variants.

Required article dimensions:

- `article_id`
- `article_uid` when provided by the package or external pipeline.
- `article_key`
- `product_key`
- `publication_key`
- `title`
- `summary`
- `tags`
- `status`
- `created_at`
- `updated_at`

Article status must be runtime availability metadata only. The app repo must not derive new source articles from raw PDF, web, prompt, or markdown production inputs.

## Article Variant

An article variant is the renderable body selected by language, audience, reading mode, revision, and availability state.

Required article variant dimensions:

- `article_variant_id`
- `article_id`
- `article_uid` or external source reference when available.
- `product_key`
- `publication_key`
- `language`
- `audience_segment`
- `reading_mode`
- `title`
- `deck`
- `tags`
- `premium_tier`
- `publish_status`
- `publish_at`
- `revision`
- `source_kind`
- `content_hash`
- `fallback_policy`
- `updated_at`
- `available_from`
- `available_until`
- `is_deleted`

Current synthetic markdown frontmatter is the canonical fixture source for these dimensions.

## Language

`language` is required on every article variant.

Current synthetic fixtures prove at least:

- `zh-CN`
- `en`

The runtime must select only variants matching the requested language unless a future documented contract explicitly allows language fallback.

## Audience Segment

`audience_segment` is required on every article variant.

Current synthetic allowed values are:

- `teen`
- `general`
- `adult`

Current fallback semantics are:

- Teen readers may fallback to `general`.
- Adult readers may fallback to `general`.
- `general` is the neutral fallback target.
- The runtime must not fallback from teen or general to adult.

Scenario expected outcomes currently declare `can_fallback_to` as `["teen", "general"]` and `cannot_fallback_to` as `["adult"]`.

## Reading Mode

`reading_mode` is required on every article variant.

Current synthetic allowed values are:

- `quick_30s`
- `deep_3m`

The runtime must treat reading mode as part of the variant business key and must not silently substitute a different reading mode unless a scenario explicitly tests that behavior.

## Revision

`revision` is required on every article variant and must be numeric.

Runtime selection prefers the latest readable revision for the requested article, language, audience fallback path, and reading mode. Revision scenarios must preserve previous user state when expected outcomes require resume or revision highlighting behavior.

## Publish Status And Publish At

`publish_status` and `publish_at` are required.

Current runtime readability rules are:

- `published` variants are readable when not deleted and within availability windows.
- `scheduled` variants are readable only when `publish_at` is at or before runtime time.
- Future-dated or expired variants are unavailable.
- Deleted variants are unavailable regardless of publish status.

## Premium Tier

`premium_tier` is required on every article variant.

Premium metadata is an access hint for runtime entitlement checks. It is not an entitlement grant, price definition, quota rule, or subscription benefit. RevenueCat or future backend-backed entitlement state remains the authority for access.

## Source Kind

`source_kind` is required.

Allowed current fixture values:

- `synthetic` in markdown variant frontmatter.
- `synthetic_test_pack` in generated runtime bundle metadata.

Future external package values must describe provenance without importing pipeline implementation into this repo.

## Content Hash

`content_hash` identifies the renderable body revision.

Current synthetic runtime bundles compute a SHA-1 hash from markdown body content. The runtime may use `content_hash` for cache invalidation, revision awareness, integrity comparison, and event attribution. It must not use the hash as proof that the app repo owns content production.

## Fallback Policy

`fallback_policy` is required for runtime-safe selection.

Current synthetic default is `allow_same_audience_only` when frontmatter omits an explicit policy, while executable selection also supports safe audience fallback to `general` through scenario expectations. Docs and implementation must stay aligned before adding new fallback modes.

## Update Metadata

Update-aware variants may carry:

- `publish_batch_id`
- `update_type`
- `update_priority`
- `change_summary`
- `notify_level`
- `is_breaking`
- `available_from`
- `available_until`

Current scenarios `s11_new_publish_batch` through `s15_quiet_hours_and_dedupe` require these fields for update and notification risks.

## Tombstone Delete Semantics

The package may express unavailable, unpublished, or deleted content through:

- `is_deleted` on article variants.
- `publish_status` values that are not currently readable.
- `available_from` and `available_until` windows.
- Runtime sync `tombstones` under scenario metadata and exported `contentSyncDelta.response.tombstones`.

Tombstones must include enough identity for the runtime to hide, invalidate, or mark content unavailable without deleting user history blindly. User-facing state should preserve revision awareness, read progress, saves, and unavailable reasons where expected outcomes require it.

## Forbidden Pipeline Responsibilities

The app repo must not implement:

- Source acquisition.
- PDF parsing.
- Web scraping.
- Prompt generation.
- Markdown generation.
- Editorial workflow scheduling.
- External pipeline orchestration.
- Raw content ingestion from external files or URLs.
- Package production from raw content.

The external pipeline owns those responsibilities and hands the repo standardized packages plus runtime metadata only.

## Acceptance Rules

A content package is acceptable to the runtime only if:

- `product_key` is present and consistent across package, article, variant, runtime metadata, events, and fixtures.
- Package identity and revision clocks are explicit.
- Publication, article, and variant identities are stable.
- Variant selection fields are present: `language`, `audience_segment`, `reading_mode`, `revision`, `publish_status`, and `publish_at`.
- Premium, experiment, pricing, quota, campaign, notification, referral, and entitlement data remain metadata or external-service snapshots, never client-hardcoded authority.
- Tombstone and delete states are represented as runtime availability state.
- Forbidden pipeline responsibilities stay outside this repository.
