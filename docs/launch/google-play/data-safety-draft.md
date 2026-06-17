# Data Safety Draft

## Status

This `Data safety` document is an evidence draft for human review. It is maintained by `google-data-safety-agent` and is not a Play Console answer set.

所有 privacy、legal、SDK disclosure、children/family、ads/tracking、security、deletion、sharing、retention、submission、release 判断均保持 `NEED_HUMAN` / `human review required`。

## Draft Summary

当前 repo evidence 显示：`apps/mobile` 是 no-credential Expo runtime shell，默认读取本地 runtime fixture，展示 discovery、article detail 和 debug seam status。当前没有看到 live Supabase、RevenueCat、Push、account/auth、ads/tracking、analytics、payment 或 Play Console 接线。

这只能作为 Data safety draft 摘要，不能作为 Google Play 表单答案。

## M4 Data Safety Evidence Draft

Primary evidence inputs: `DATA_INVENTORY.md`, `SDK_INVENTORY.md`, and `LAUNCH_INFO.md`.

| claim_id | claim_class | status | draft value | evidence_refs | human gate |
| --- | --- | --- | --- | --- | --- |
| `gdsa.c3.local_fixture_content_needs_review` | `C3` | `needs_human` | 当前 shell 渲染本地 fixture 内容，public store use 前需要隐私、内容和授权审查 | `evidence.gdsa.data_inventory`, `evidence.gdsa.fixture_smoke` | yes |
| `gdsa.c3.no_live_service_collection_observed` | `C3` | `needs_human` | 当前 repo 未观察到 live Supabase、RevenueCat、Push、ads/tracking 或 analytics，但 release artifact 仍需审查 | `evidence.gdsa.sdk_inventory`, `evidence.gdsa.service_seams` | yes |
| `gdsa.c4.play_console_answers_need_human` | `C4` | `needs_human` | Data Safety answers 不能从 repo draft 自动填写，必须由 owner/Pro 审阅 | `evidence.gdsa.human_review_gate` | yes |

## Current Repo Evidence

| Topic | Draft observation | Evidence | Review |
| --- | --- | --- | --- |
| Runtime source | Local fixture reader is the default source | `apps/mobile/src/runtime/runtime-data-source.ts`, `docs/mobile/MOBILE_RUNTIME_SHELL.md` | human review required |
| Local fixture content | App renders article metadata/body from generated fixture bundle | `apps/mobile/app/index.tsx`, `apps/mobile/app/article/[articleId].tsx`, `mobile/fixtures/runtime/current/runtime.bundle.json` | NEED_HUMAN |
| Supabase | Reserved seam; `live_service_connected=false`; selected Supabase mode without env returns unavailable state | `packages/core-runtime/src/seams/supabase-seam.ts`, smoke output `supabase: status=unavailable reason=missing_env` | NEED_HUMAN |
| RevenueCat | Reserved seam; no purchase, entitlement grant, prices, quotas, or customer setup | `packages/core-runtime/src/seams/revenuecat-entitlement-seam.ts` | NEED_HUMAN |
| Push | Reserved notification seam; no permission request, token registration, delivery, or inbox state | `packages/core-runtime/src/seams/notification-seam.ts` | NEED_HUMAN |
| Accounts/auth | No account sign-in route or auth setup evidenced in current app shell | `apps/mobile/app/**`, `README.md`, `apps/mobile/README.md` | NEED_HUMAN |
| Ads/tracking | No ads/tracking SDK evidenced in current manifests or scoped current-app source search | `package.json`, `apps/mobile/package.json`, `apps/mobile/app.json` | NEED_HUMAN |
| Sensitive permissions | No camera/location/contacts/microphone/photo/media permission configuration evidenced in current app shell | `apps/mobile/app.json`, scoped source search | NEED_HUMAN |
| Children/family | No target audience decision evidenced | launch docs and `docs/NEED_HUMAN.md` | NEED_HUMAN |
| App identity | Current shell config and root config differ in release identity metadata | root `app.json`, `apps/mobile/app.json` | NEED_HUMAN |

## Draft Data Safety Notes

- Do not mark any Data safety category as resolved from this draft alone.
- Do not claim cloud sync, subscriptions, push delivery, accounts, ads/tracking, analytics, crash reporting, production content ingestion, or Play Console submission.
- Do not remove `NEED_HUMAN` from any privacy or Data safety answer without explicit human evidence.
- Treat fixture content as review-required: it may contain publication names, article text, summaries, or metadata that need rights/policy review before public store use.

## Required Human Review

- Privacy policy URL.
- Developer contact.
- Data collection, sharing, deletion, retention, and security answers.
- SDK disclosure and release artifact SDK inventory.
- Children/family policy, target audience, age range, content rating, and Families policy applicability.
- Ads/tracking, analytics, identifiers, attribution, crash reporting, and diagnostics.
- App release identity and production config source of truth.
- Legal/privacy sign-off before Play Console use.
