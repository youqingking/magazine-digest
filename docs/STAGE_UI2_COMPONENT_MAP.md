# Stage UI2 Component Map

## Shared Visual System

| Need | Current component/file | UI2 direction |
| --- | --- | --- |
| Card shell | `components/ui/AppCard.vue` | Soften into editorial layered card with calmer shadows and cooler neutral surfaces |
| Section heading | `components/ui/SectionHeader.vue` | Keep for secondary sections; reduce use in first-screen chrome |
| Tabs / mode switch | `components/ui/ModeTabs.vue` | Move toward quieter pill switch matching detail/home nav tone |
| Meta rows | `components/ui/MetaRow.vue` | Keep but de-emphasize visually |
| State treatment | `components/ui/StatePanel.vue` | Keep structure, update tone only |

## Home / Discovery

| Surface | Current component | UI2 plan |
| --- | --- | --- |
| Home article cards | `components/discovery/DiscoverySection.vue` | Add editorial list/card variant for home |
| Filter chips | `components/discovery/FilterChip.vue` | Reuse as calmer source/category pills |
| Inbox badge | `components/discovery/InboxBadge.vue` | Keep capability, reduce prominence |
| Resume / update surfaces | `ResumeCard.vue`, `UpdateBadge.vue`, `DigestCard.vue` | Harmonize into quieter editorial cards |

## Reader

| Surface | Current component | UI2 plan |
| --- | --- | --- |
| Article title block | `components/reader/ArticleTitleBlock.vue` | Rebuild into top editorial header aligned with Stitch detail |
| Article body | `components/reader/ArticleBodyBlock.vue` | Preserve full reading flow; refine spacing/typography only |
| Audience/unavailable blocks | `UnavailableReasonBlock.vue` and related | Keep semantics, restyle to calmer reading surfaces |

## Commercial / Growth

| Surface | Current component | UI2 plan |
| --- | --- | --- |
| Offer summary | `components/commercial/OfferSummaryCard.vue` | Apply premium visual treatment without changing Stage G semantics |
| Quota | `components/commercial/QuotaStatusCard.vue` | Keep visible, style as restrained state card |
| Promo preview | `components/commercial/PromoCodeInput.vue` | Align with search/paywall input language |
| Invite/reward | `components/growth/*` | Apply same card spacing and list discipline as profile/settings |

## Account / Foundation

| Surface | Current component | UI2 plan |
| --- | --- | --- |
| Auth/device cards | `components/account/*` | Keep intact; re-skin rather than remove |
| Push preview | `PushStateCard.vue` | Preserve visibility with quieter shell |
| Build audit | `services/build-meta.service.js` + settings block | Keep dev-only, low prominence |
