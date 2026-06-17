# Data Safety Evidence

## Status

This file is evidence for the Data safety draft. It is not a Play Console answer.

Every legal, privacy, SDK disclosure, children/family, ads/tracking, Data safety, and submission decision remains `human review required` / `NEED_HUMAN`。

## Evidence Table

| Evidence | Classification | What it supports | Limit |
| --- | --- | --- | --- |
| `README.md` | repo boundary evidence | Repo is Expo-first migration workspace; external content production pipeline is out of app repo scope | Does not prove store policy answers |
| `apps/mobile/README.md` | implemented code evidence | Current routes are discovery, article detail, and debug seam status | Must be reviewed against release artifact |
| `docs/mobile/MOBILE_RUNTIME_SHELL.md` | implemented code evidence | Runtime shell uses local fixture bundles and keeps service seams fail-closed | Must be reviewed against release artifact |
| `docs/mobile/SUPABASE_ENV_CONTRACT.md` | reserved seam evidence | Supabase mode requires explicit public env and fails closed when missing | Does not prove future Supabase data handling |
| `apps/mobile/package.json` | repo manifest evidence | Current mobile dependencies do not list Supabase SDK, RevenueCat SDK, `expo-notifications`, ads/tracking SDKs, or analytics SDKs | Release artifact review required |
| `apps/mobile/app.json` | app config evidence | Current shell config has no production package id, permissions, push config, privacy strings, or service endpoints | Root config conflict requires human review |
| root `app.json` | release identity blocker evidence | Contains `owner`, EAS `projectId`, and `android.package` outside `apps/mobile` | Human must decide release source of truth |
| `apps/mobile/app/index.tsx` | implemented code evidence | Renders local fixture discovery list with `product_key`, scenario id, publication labels, titles, summaries | Fixture content still needs policy/rights review |
| `apps/mobile/app/article/[articleId].tsx` | implemented code evidence | Renders local fixture article detail and `markdown_body` paragraphs | Fixture content still needs policy/rights review |
| `apps/mobile/app/debug.tsx` | implemented code evidence | Renders seam descriptors for Supabase, RevenueCat, and notification placeholders | Seam descriptors are not live integrations |
| `apps/mobile/src/runtime/runtime-data-source.ts` | implemented code evidence | Defaults to fixture; selects Supabase seam only with `EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase` | Does not connect Supabase |
| `packages/core-runtime/src/seams/supabase-seam.ts` | reserved seam | Supabase is not live; missing env renders unavailable state | Future service setup may change Data safety answers |
| `packages/core-runtime/src/seams/revenuecat-entitlement-seam.ts` | reserved seam | RevenueCat is not live; no purchase or entitlement grant | Future subscription setup requires review |
| `packages/core-runtime/src/seams/notification-seam.ts` | reserved seam | Push is not live; no token registration or delivery | Future notification setup requires review |
| `packages/core-runtime/src/adapters/runtime-fixture-adapter.ts` | implemented code evidence | Fixture entitlement/notification metadata is local placeholder data, not a grant or registration | Does not prove future service behavior |
| `docs/privacy/DATA_INVENTORY.md` | draft inventory evidence | Current local data surfaces and non-evidenced data categories | Needs human review |
| `docs/privacy/SDK_INVENTORY.md` | draft SDK evidence | Current repo dependency evidence | Release artifact review required |
| `docs/launch/privacy/human-review-required.md` | review gate | Privacy and Data safety blocker list | Does not replace legal/privacy review |
| `docs/NEED_HUMAN.md` | blocker ledger | External account, privacy, SDK, Data safety, and submission gates | Human owner must resolve |
| `evidence.gdsa.data_inventory` | implemented code evidence | `docs/privacy/DATA_INVENTORY.md` records current local data surfaces | Data Safety still requires human review |
| `evidence.gdsa.sdk_inventory` | reserved seam evidence | `docs/privacy/SDK_INVENTORY.md` records current repo SDK/seam evidence | Release artifact review required |
| `evidence.gdsa.service_seams` | reserved seam evidence | Supabase, RevenueCat, and Push are reserved seams in current repo evidence | Future service setup may change Data Safety answers |
| `evidence.gdsa.human_review_gate` | human gate evidence | `docs/launch/google-play/data-safety-human-review-required.md` records owner review blockers | Does not replace Play Console review |

## Command Evidence

本轮已执行：

```text
npm.cmd --prefix apps/mobile run smoke:fixture
```

结果摘要：

- `MOBILE_FIXTURE_READER_SMOKE_PASSED`
- `current: product_key=demo_cn_content scenario=data2_multi_publication_release_candidate articles=30 surfaces=30`
- `s01_normal_full_matrix: product_key=demo_cn_content scenario=s01_normal_full_matrix articles=1 surfaces=30`
- `supabase: status=unavailable reason=missing_env`

## Evidence Notes

- Current fixture evidence confirms `product_key=demo_cn_content` and a local scenario-backed content surface.
- Supabase smoke evidence remains unavailable because env is missing; fixture data is not substituted in Supabase mode.
- Scoped repo search over current app manifests/source found no current `expo-notifications`, `react-native-purchases`, `@supabase/*`, ads/tracking SDK, analytics SDK, Firebase, Sentry, or sensitive permission config in `apps/mobile`.
- Legacy `mobile/`, `uniCloud/`, `admin/`, backend docs, and generated outputs may mention auth, push, payment, permissions, or events, but AGENTS and README define them as migration/reference areas rather than current future shell behavior.

## NEED_HUMAN

- Verify release artifact SDK inventory and native permissions.
- Verify Privacy policy URL and Developer contact.
- Verify Data safety answers with privacy/legal owner.
- Verify children/family, ads/tracking, identifiers, deletion, retention, sharing, security, SDK disclosure, and app identity answers.
- Verify content authorization and publication/trademark claims before public store use.
