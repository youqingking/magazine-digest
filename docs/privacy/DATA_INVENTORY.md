# DATA_INVENTORY

## Status

本文件是 `data inventory draft`，只基于当前 repo evidence 整理 Google Play / Data safety 人工审阅前的资料。它不是 privacy policy，不是法律意见，也不是 Google Play Data safety 答案。

所有 privacy、Data safety、legal、children/family、ads/tracking、SDK disclosure、submission 判断均保持 `NEED_HUMAN` / `human review required`。

## Evidence Scope

本轮只审阅当前 Expo-first app shell 与仓库内文档：

- 当前 app shell：`apps/mobile`
- fixture 输入：`mobile/fixtures/runtime/current/runtime.bundle.json`
- runtime 共享包：`packages/core-runtime`
- Play Store / privacy 草稿：`docs/privacy`、`docs/launch/google-play`

本轮没有检查 Play Console、Google Play release artifact、AAB/APK native manifest、真实 Supabase project、RevenueCat project、push credential、production config 或外部数据流水线。

## Current Data Surfaces

| Surface | Current repo evidence | Visible data/source | Review status |
| --- | --- | --- | --- |
| Discovery list | `apps/mobile/app/index.tsx`, `apps/mobile/src/runtime/use-runtime-fixture.ts` | 本地 runtime fixture 中的 publication label、article title、summary、`product_key`、scenario id | implemented in current shell; human review required |
| Article detail | `apps/mobile/app/article/[articleId].tsx` | 本地 fixture detail response 中的 title、publication、audience、reading mode、revision、`markdown_body` paragraphs | implemented in current shell; human review required |
| Scenario/debug status | `apps/mobile/app/debug.tsx` | selected scenario、`product_key`、Supabase / RevenueCat / notification seam descriptors | implemented code evidence; no live-service conclusion |
| Runtime source selection | `apps/mobile/src/runtime/runtime-data-source.ts` | 默认 `fixture`；`EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase` 时进入 Supabase reserved seam | human review required |
| Supabase unavailable state | `packages/core-runtime/src/seams/supabase-seam.ts` | 缺少 `EXPO_PUBLIC_SUPABASE_URL`、`EXPO_PUBLIC_SUPABASE_ANON_KEY`、`EXPO_PUBLIC_PRODUCT_KEY` 时返回 unavailable；不回退 fixture | reserved seam evidence; NEED_HUMAN |
| Fixture entitlement metadata | `packages/core-runtime/src/adapters/runtime-fixture-adapter.ts` | 本地 placeholder message，明确不是 RevenueCat grant | reserved seam evidence; NEED_HUMAN |
| Fixture notification metadata | `packages/core-runtime/src/adapters/runtime-fixture-adapter.ts` | 本地 placeholder message，明确不是 push registration | reserved seam evidence; NEED_HUMAN |

## Current Data Handling Boundary

- 当前 shell 读取已经导出的 runtime fixture bundle，并把内容映射到 discovery、article detail、debug route。
- 当前 shell 没有实现 account sign-in、user profile、user-generated content、cloud sync、payment、subscription purchase、push token registration、analytics event upload、ads/tracking 或 Play Console submission。
- 当前 shell 没有请求 camera、location、contacts、microphone、photo/media、Bluetooth、calendar、health 等敏感 runtime permissions 的 repo evidence。
- 当前 shell 没有连接 Supabase、RevenueCat、Expo Push、FCM/APNs、ads network、analytics provider 或 attribution provider 的 repo evidence。
- `product_key` 是当前和未来 service seam 的必备维度；任何后续真实服务、event、config、subscription、notification 数据都必须继续保留 `product_key`。

## Not Evidenced In Current Shell

以下事项没有在当前 `apps/mobile` shell 中看到 live app behavior，但不能据此填写 Google Play Data safety；它们必须保留 `NEED_HUMAN`：

- Account/authentication data。
- User profile、device account、developer-provided ID 或 user ID。
- Purchase、subscription、entitlement、payment 或 billing data。
- Push notification token、device registration、notification preference 或 delivery data。
- Live Supabase sync、cloud storage、event ingestion、remote config 或 RLS-backed records。
- Ads、analytics、tracking、advertising identifiers、attribution 或 cross-app identifiers。
- Precise/approximate location、contacts、photos/media、camera、microphone 或其他 sensitive permission data。
- Children/family policy、target audience、content rating 与 age gate 相关判断。
- Data deletion、retention、sharing、encryption/security practices。
- Privacy policy URL、developer contact、legal/privacy sign-off。

## Current Verification Evidence

本轮只读验证命令：

```text
npm.cmd --prefix apps/mobile run smoke:fixture
```

结果摘要：

- `MOBILE_FIXTURE_READER_SMOKE_PASSED`
- `current: product_key=demo_cn_content scenario=data2_multi_publication_release_candidate articles=30 surfaces=30`
- `s01_normal_full_matrix: product_key=demo_cn_content scenario=s01_normal_full_matrix articles=1 surfaces=30`
- `supabase: status=unavailable reason=missing_env`

## M2 Harness Claims

| harness claim | claim_class | status | value | evidence_refs | human gate |
| --- | --- | --- | --- | --- | --- |
| `pdp.c0.fixture_data_surfaces_observed` | `C0` | `observed_in_repo` | 当前 shell 展示本地 fixture discovery、article detail、debug seam status | `evidence.pdp.data_inventory`, `evidence.pdp.smoke_fixture` | no |
| `pdp.c3.privacy_policy_url_missing` | `C3` | `needs_human` | repo 中没有可用于 Play Store 的 Privacy policy URL | `evidence.pdp.privacy_policy_missing` | yes |
| `pdp.c3.service_seams_need_review` | `C3` | `needs_human` | Supabase、RevenueCat、Push 是 reserved seam，不是 live service 结论 | `evidence.pdp.service_seams` | yes |
| `pdp.c4.data_safety_requires_owner_review` | `C4` | `needs_human` | Data safety 表单答案只能作为 evidence draft，必须由 owner/Pro 审阅 | `evidence.pdp.data_safety_draft` | yes |

## Evidence Files

- `README.md`
- `apps/mobile/README.md`
- `apps/mobile/app.json`
- `apps/mobile/package.json`
- `apps/mobile/app/index.tsx`
- `apps/mobile/app/article/[articleId].tsx`
- `apps/mobile/app/debug.tsx`
- `apps/mobile/src/runtime/runtime-data-source.ts`
- `docs/mobile/MOBILE_RUNTIME_SHELL.md`
- `docs/mobile/SUPABASE_ENV_CONTRACT.md`
- `packages/core-runtime/src/runtime-fixture-reader.ts`
- `packages/core-runtime/src/adapters/runtime-fixture-adapter.ts`
- `packages/core-runtime/src/seams/supabase-seam.ts`
- `packages/core-runtime/src/seams/revenuecat-entitlement-seam.ts`
- `packages/core-runtime/src/seams/notification-seam.ts`

## NEED_HUMAN

- Review fixture content for personal, sensitive, copyrighted, licensed, regulated, children-directed, or policy-sensitive data before public store use.
- Confirm Privacy policy URL and Developer contact.
- Confirm Data safety answers against the actual release artifact and service configuration.
- Confirm SDK disclosure, release artifact SDK inventory, children/family, ads/tracking, identifiers, data deletion, retention, sharing, and security answers.
- Confirm whether root `app.json` or `apps/mobile/app.json` is the release source of truth before any Play Store or EAS decision.
