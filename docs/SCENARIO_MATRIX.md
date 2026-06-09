# Scenario Matrix

| Scenario | Core purpose | Key risks covered |
| --- | --- | --- |
| `s01_normal_full_matrix` | Happy-path read smoke with teen/adult and quick/deep matrix | variant selection, mode switch, baseline feed/detail |
| `s02_general_fallback` | Teen request must fallback only to general | safe audience fallback, adult leak prevention |
| `s03_teen_unavailable` | Teen request has no safe variant | explicit unavailable reason, no unsafe guess |
| `s04_multilingual` | Same article family in `zh-CN` and `en` | language exact match, future multilingual smoke |
| `s05_revision_update` | Revision 1 to revision 2 delta | highest revision selection, sync delta, cache invalidation |
| `s06_tombstone_and_unpublish` | Withdrawal and scheduled content visibility | tombstone handling, feed/detail invisibility, sync semantics |
| `s07_premium_paywall` | Premium content with denied entitlement | paywall entry, entitlement snapshot, pricing preview |
| `s08_experiment_pricing_preview` | Experiment bucket plus campaign preview | pricing preview, experiment assignment, floor-price copy smoke |
| `s09_cache_offline_fallback` | Warm cache then remote failure | cached feed/detail fallback, cached safety boundary |
| `s10_multi_publication_feed` | Feed assembled from multiple publications | publication/channel/tag grouping, mixed feed smoke |
| `s11_new_publish_batch` | Fresh publish batch enters discovery and batch summary | batch grouping, newness metadata, availability window |
| `s12_followed_topic_alert` | Followed publication or topic emits targeted alert | follow edge matching, notify level gating, inbox persistence |
| `s13_inbox_digest` | Multiple low-priority updates collapse into digest | digest aggregation, unread counts, open tracking |
| `s14_revision_highlight` | Existing article revision should be highlighted instead of treated as brand-new | revision prominence, change summary, continue-read integrity |
| `s15_quiet_hours_and_dedupe` | Delivery falls into quiet hours and collides with prior send | suppression, dedupe window, inbox-vs-push split |

## Coverage Notes

- Publications used: `world_brief`, `ai_digest`, `market_watch`
- Tags used: `economy`, `ai`, `policy`, `market`, `productivity`
- Total markdown variants are intentionally kept small and reusable for later stages.
- Stage F0 scenario families add publish-batch metadata, follow edges, inbox fixtures, and quiet-hours preference variants without requiring real push connectivity.
