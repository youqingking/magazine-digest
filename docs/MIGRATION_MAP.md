# Shared Base Migration Map

## Objective

Extract the shared platform base before a second product exists so the YouTube app can plug into stable packages instead of copying the magazine app and untangling it later.

## Migration Strategy

- additive only
- adapter first
- keep current magazine behavior stable
- no business page rebuild
- no immediate UniCloud collection rename

## Recommended Order

### Phase 0: Freeze Names And Boundaries

- publish shared nouns and split rules in docs
- keep current magazine nouns behind mapping tables only

### Phase 1: Extract `attention-core-contracts`

Move first:

- shared enums from `shared/contracts/*`
- shared runtime contract constants from `mobile/contracts/*`
- shared DTOs for access, discovery, notification, pricing, and telemetry
- alias maps from `article/publication` to `content_item/content_source`

Reason:

- this is the cheapest extraction and prevents more magazine-specific naming from spreading

### Phase 2: Extract `attention-core-runtime`

Move next:

- runtime gateway and runtime-source selection
- cache, sync, tombstone, and offline fallback services
- entitlement, pricing, quota, promo preview, and experiment services
- discovery, follow, inbox, save-for-later, resume, notification, push, and observability services
- backend shared surfaces that are already content-type-agnostic

Current repo starting points:

- `mobile/services/*.service.js`
- `backend/surfaces/*.mjs`
- `backend/runtime/*.mjs`
- `backend/adapters/*.mjs`

### Phase 3: Extract `attention-core-mobile-ui`

Move next:

- shell-safe UI primitives
- shared content cards and section wrappers
- discovery/commercial/account shell cards that do not embed magazine-only wording
- theme tokens and typography primitives

Do not move:

- existing business pages under `mobile/pages/*`

### Phase 4: Extract `attention-core-admin`

Move next:

- generated shared resources for product/commercial/notification/discovery entities
- shared manual workflow consoles
- shared contract map and registry wiring

Keep domain-specific:

- issue ops
- taxonomy override ops
- future channel/video domain consoles

### Phase 5: Extract `attention-core-harness`

Move next:

- schema validation
- shared runtime smoke flows
- scenario export/select helpers
- shared fixture format and reports

Keep domain-specific fixture builders as adapters under each app.

### Phase 6: Add Domain Adapters

- magazine adapter becomes the first consumer of shared packages
- YouTube adapter is added later without changing shared package ownership

## Current To Target Mapping

| Current location | Target package |
| --- | --- |
| `shared/contracts/*`, `mobile/contracts/*` | `attention-core-contracts` |
| `mobile/services/cache.service.js`, `content-sync.service.js`, `runtime-gateway.service.js`, `remote-runtime.service.js`, `runtime-source.service.js` | `attention-core-runtime` |
| `mobile/services/entitlement.service.js`, `pricing.service.js`, `quota.service.js`, `promo.service.js`, `experiment.service.js` | `attention-core-runtime` |
| `mobile/services/discovery.service.js`, `follow.service.js`, `notification.service.js`, `push.service.js`, `content-state.service.js` | `attention-core-runtime` |
| `backend/surfaces/*` except domain-only adapters added later | `attention-core-runtime` |
| `mobile/components/ui/*` and shell-safe parts of `mobile/components/discovery`, `commercial`, `account` | `attention-core-mobile-ui` |
| `admin/pages-generated/*`, `admin/src/services/*`, shared modules under `admin/src/modules/*` | `attention-core-admin` |
| `scripts/contracts/*`, `scripts/harness/*`, shared fixture export/selection scripts | `attention-core-harness` |

## Risks If Shared Base Is Not Extracted First

1. the YouTube app will clone magazine nouns like `article`, `publication`, and `issue` into places that should have stayed generic
2. every new shared feature will be implemented twice: once in magazine terms, then again in video terms
3. schema drift will grow between products, raising admin, telemetry, and reporting costs
4. pricing, entitlement, push, experiments, and observability rules will fork and become harder to audit
5. a later extraction will force larger renames across mobile, admin, backend, scripts, fixtures, and UniCloud schemas
6. operator workflows will couple to one content domain and become expensive to generalize later
7. migration risk rises because physical storage renames become more likely once two apps depend on different copies

## Recommended Physical Rename Policy

Do not rename these collections in the extraction step:

- `articles`
- `article_variants`
- `publications`

Instead:

- define shared aliases in contracts
- add magazine adapters
- defer physical rename until a real second domain requires shared persistence

## Exit Criteria For This Step

- shared vs domain-specific boundary is frozen
- migration order is frozen
- package layout is frozen
- no page work is mixed into extraction
