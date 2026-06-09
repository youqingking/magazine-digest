# Shared vs Domain Split

## Freeze

The boundary is frozen as:

1. shared base
2. magazine-only domain
3. YouTube-only domain

No new work should cross these boundaries without an explicit boundary-change decision.

## Shared Base

Shared base contains only capabilities that are reusable across processed-content apps:

- product bootstrap and `product_key` routing
- content-item selection by audience, mode, publish state, and availability window
- cache, delta sync, tombstones, offline fallback, runtime-source selection
- entitlement, quota, pricing preview, paywall decision, promo preview, and benefits summary
- discovery feed, follow graph, inbox, notification prefs, push capability, save-for-later, resume, release-batch summary
- event ingest, experiments, feature flags, observability, audit, and release/runtime proof
- shared admin CRUD/workflow rails for shared entities
- shared harness, fixture export, validation, and smoke orchestration
- shared mobile shell components and themes

## Magazine-Only Domain

These capabilities stay outside the shared base because they are editorial-print specific:

- `publication`, `issue`, and `article` editorial identity
- issue-level release packaging, issue labeling, and issue registry management
- publication section taxonomy and canonical section mapping
- article metadata override workflow keyed by publication and issue
- source-pack parsing assumptions from processed magazine bundles
- print-style metadata such as section path, issue cover positioning, and publication-led discovery labels
- magazine operator workflows tied to release candidate packs and issue curation

## YouTube-Only Domain

These capabilities stay outside the shared base because they are video specific:

- `channel`, `video`, `playlist`, and creator identity
- transcript/caption asset metadata and transcript-quality status
- video duration, chapters, timestamp anchors, and playback-derived resume anchors
- thumbnail, poster frame, and video-specific discovery artwork rules
- creator/channel follow semantics that require channel-specific policy or playlist grouping
- video-specific moderation or rights metadata
- video source freshness rules such as premiere/live/archive distinctions

## Split By Area

| Area | Shared base | Magazine-only | YouTube-only |
| --- | --- | --- | --- |
| Core identity | `product`, `content_source`, `content_item`, `content_variant` | publication, issue, article | channel, video, playlist |
| Processed payload | normalized content body, title, summary, tags, availability | section labels, issue order, publication-specific editorial metadata | transcript source quality, duration, chapters, thumbnail set |
| Variant logic | audience, reading mode, availability, fallback, revision | article-specific fallback nuances if any remain | transcript/language/video-summary fallback |
| Resume state | basis points, saved state, newness, resume anchor | article scroll anchor | playback timestamp or chapter anchor |
| Discovery | follow subjects, release batch, inbox, saved, continue reading | publication filters, issue filters, editorial buckets | creator/channel filters, playlist facets, duration facets |
| Admin | shared product/commercial/discovery/notification entities | issue ops, taxonomy overrides, pack quality audit | channel/video domain metadata, transcript readiness |
| Harness | shared contract/runtime/schema checks | processed magazine pack fixtures | processed YouTube summary fixtures |

## Capabilities That Must Stay Domain-Specific

- source identity models beyond generic `content_source`
- domain metadata enrichment rules
- domain operator workflows
- domain fixture builders
- domain-specific rendering hints that are not needed by both products

## Adapter Rule

Both apps must enter the shared base through adapters:

- magazine adapter maps publication/article/issue structures into shared content contracts
- YouTube adapter maps channel/video/transcript structures into shared content contracts

The shared base must not know how a PDF, webpage, or transcript was produced.
