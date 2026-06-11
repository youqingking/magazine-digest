# Runtime Scenario Matrix

## Purpose

Map the current synthetic scenario families to the runtime risks they cover. This matrix is documentation for the existing source-of-truth fixture scripts and inputs; it does not change scenario behavior.

## Source Paths

Scenario source lives under:

- `fixtures/test-inputs/scenarios/*/scenario.meta.json`
- `fixtures/test-inputs/scenarios/*/*.md`
- `fixtures/test-inputs/scenarios/*/expected-outcomes.json`
- `fixtures/test-inputs/manifests/scenario-index.json`

Runtime scenario bundles are generated to:

- `output/test-input-pack/runtime/*.bundle.json`
- `mobile/fixtures/runtime/scenarios/*.bundle.json`

Selected mobile runtime fixtures are generated to:

- `mobile/fixtures/runtime/current/**`

## Scenario Matrix

| Scenario Family | Primary Risk Covered | Runtime Surfaces Exercised |
| --- | --- | --- |
| `s01_normal_full_matrix` | Full matrix across audience and reading mode happy paths | `bootstrap-config`, `content-sync-delta`, `content-detail`, `entitlement-snapshot`, `experiment-assign` |
| `s02_general_fallback` | Safe fallback from specific audience request to general content | `content-detail`, expected fallback behavior |
| `s03_teen_unavailable` | Unavailable content when teen-safe fallback is missing | `content-detail`, unavailable reason |
| `s04_multilingual` | Multilingual variant selection | `content-detail`, language-specific variants |
| `s05_revision_update` | Revision selection and update awareness | `content-sync-delta`, `content-detail`, revision metadata |
| `s06_tombstone_and_unpublish` | Tombstone, delete, and unpublished availability states | `content-sync-delta`, tombstones, unavailable content |
| `s07_premium_paywall` | Premium tier and paywall behavior | `entitlement-snapshot`, `content-detail`, premium variants |
| `s08_experiment_pricing_preview` | Experiment assignment and pricing preview | `experiment-assign`, `pricing-preview`, feature flags |
| `s09_cache_offline_fallback` | Offline cache and cacheable entitlement fallback | `entitlement-snapshot`, cache expected outcomes |
| `s10_multi_publication_feed` | Multi-publication discovery and feed behavior | `discoveryCatalog`, `followCatalog`, publication metadata |
| `s11_new_publish_batch` | New publish batch and update metadata | `publishBatches`, `content-sync-delta`, update fields |
| `s12_followed_topic_alert` | Follow alerts and followed-topic inbox items | `userFollows`, `notificationInbox`, `followCatalog` |
| `s13_inbox_digest` | Inbox digest and digest-eligible refresh content | `notificationInbox`, digest source items |
| `s14_revision_highlight` | Revision highlight while preserving reading state | `content-detail`, `userContentState`, revision metadata |
| `s15_quiet_hours_and_dedupe` | Notification suppression, quiet hours, and dedupe | `notificationPrefs`, `notificationDeliveries`, inbox surfaces |
| `s16_quota_exhausted_paywall` | Quota exhaustion and paywall trigger | `quota-status`, `commercial-offer`, `entitlement-snapshot` |
| `s17_campaign_discount_offer` | Campaign offer preview and campaign landing | `campaign-landing`, `commercial-offer`, pricing metadata |
| `s18_promo_code_apply_preview` | Promo code preview without redemption authority | `promo-preview`, `pricing-preview`, commercial surfaces |
| `s19_referral_reward_preview` | Referral preview and reward summary | `referral-summary`, `reward-summary`, profile surfaces |
| `s20_active_entitlement_profile` | Active entitlement and profile benefits | `profile-benefits`, `entitlement-snapshot`, quota/reward/profile surfaces |

## Risk Coverage Checklist

The current scenario set covers:

- Full matrix: `s01_normal_full_matrix`.
- Fallback: `s02_general_fallback`.
- Unavailable: `s03_teen_unavailable`.
- Multilingual: `s04_multilingual`.
- Revision: `s05_revision_update`, `s14_revision_highlight`.
- Tombstone: `s06_tombstone_and_unpublish`.
- Premium/paywall: `s07_premium_paywall`, `s16_quota_exhausted_paywall`.
- Experiment/pricing: `s08_experiment_pricing_preview`.
- Offline cache: `s09_cache_offline_fallback`.
- Multi-publication: `s10_multi_publication_feed`.
- Publish batch: `s11_new_publish_batch`.
- Follow alerts: `s12_followed_topic_alert`.
- Inbox digest: `s13_inbox_digest`.
- Notification suppression: `s15_quiet_hours_and_dedupe`.
- Quota: `s16_quota_exhausted_paywall`.
- Campaign: `s17_campaign_discount_offer`.
- Promo: `s18_promo_code_apply_preview`.
- Referral: `s19_referral_reward_preview`.
- Entitlement/profile: `s20_active_entitlement_profile`.

## Selection Rules

The scenario index is canonical:

- `fixtures/test-inputs/manifests/scenario-index.json`

The selector accepts only an existing exported scenario id. Current selection uses:

```powershell
npm.cmd run select:runtime-scenario -- -ScenarioId s01_normal_full_matrix
```

Selection writes `mobile/fixtures/runtime/current/**` and `output/test-input-pack/reports/current-scenario.json`. It must not modify source fixtures under `fixtures/test-inputs/**`.

## Product Key Rule

Every scenario must preserve `product_key` in source metadata and generated runtime surfaces. Scenario metadata, content variants, bootstrap config, entitlement snapshots, pricing previews, experiment assignment, commercial surfaces, notification surfaces, and profile surfaces must remain product-scoped.
