# SDK_INVENTORY

## Status

本文件是 `SDK inventory draft`，只根据当前 repo manifests、app config、source imports 与 docs 记录可见 SDK/依赖事实。This is not a final Android artifact inventory.

所有 SDK disclosure、Data safety、children/family、ads/tracking、submission 判断均保持 `NEED_HUMAN` / `human review required`。真实 Google Play SDK inventory 必须以 release artifact、native manifest、Gradle dependency tree、Expo prebuild/build output 和第三方服务配置为准。

## Current Repo Evidence

| SDK / Package / Seam | Current evidence | Current observed status | Review status |
| --- | --- | --- | --- |
| Expo | root `package.json`, `apps/mobile/package.json`, `apps/mobile/app.json` | Current shell runtime dependency; no Play credential or signing material in repo | human review required |
| Expo Router | `apps/mobile/package.json`, routes under `apps/mobile/app/**` | Local app routing for `/`, `/article/[articleId]`, `/debug` | human review required |
| React / React Native | `apps/mobile/package.json` | UI runtime dependencies for current shell | human review required |
| TypeScript | `apps/mobile/package.json`, `apps/mobile/tsconfig.json` | Typecheck/build tooling | human review required |
| React Native safe area / screens | `apps/mobile/package.json` | Navigation/layout support dependencies | human review required |
| Expo Linking | `apps/mobile/package.json` | Dependency present; no current deep-link data collection conclusion from repo evidence | NEED_HUMAN |
| Supabase seam | `packages/core-runtime/src/seams/supabase-seam.ts`, `docs/mobile/SUPABASE_ENV_CONTRACT.md` | Reserved seam only; no `@supabase/*` package evidenced in `apps/mobile/package.json`; no live connection | NEED_HUMAN |
| RevenueCat seam | `packages/core-runtime/src/seams/revenuecat-entitlement-seam.ts` | Reserved seam only; no `react-native-purchases` package evidenced; no purchase, entitlement grant, price, quota, or customer setup | NEED_HUMAN |
| Product notification seam / Push | `packages/core-runtime/src/seams/notification-seam.ts` | Reserved seam only; no `expo-notifications` package evidenced in current shell; no permission request, token registration, inbox, or delivery | NEED_HUMAN |
| Ads / analytics / tracking SDK | `package.json`, `apps/mobile/package.json`, scoped `rg` over current app manifests/source | No ads, analytics, attribution, Firebase, Sentry, AdMob, tracking, or advertising SDK evidenced in current shell | NEED_HUMAN |
| Sensitive permission SDKs | `apps/mobile/app.json`, scoped `rg` over `apps/mobile` | No camera/location/contacts/microphone/photo/media permission configuration evidenced in current shell | NEED_HUMAN |

## App Config Evidence

- `apps/mobile/app.json` currently defines the runtime shell name, slug, scheme, orientation, user interface style, new architecture, and typed routes experiment.
- `apps/mobile/app.json` currently does not define production `android.package`, iOS bundle identifier, EAS owner/project id, push credentials, permission strings, ads identifiers, analytics config, Supabase URL, RevenueCat key, or Play Console submission settings.
- root `app.json` contains `owner`, `extra.eas.projectId`, and `android.package`; this must be reconciled by a human before release because the current app implementation target is `apps/mobile`.

## Release Artifact Review Needed

Repo inventory is not enough for Play Console answers. A human reviewer must inspect:

- Generated Android manifest and iOS native config.
- EAS / Expo build profile and generated release artifact.
- Dependency tree from the actual build environment.
- Any config plugins, native modules, permissions, tracking identifiers, ads SDKs, analytics SDKs, crash-reporting SDKs, or externally injected services.
- Third-party SDK disclosure requirements and Google Play SDK Index notices, if any.

## NEED_HUMAN

- Confirm release artifact SDK inventory.
- Confirm third-party SDK disclosure and Google Play SDK policy implications.
- Confirm whether ads/tracking, analytics, identifiers, children/family policy, sensitive permissions, crash reporting, attribution, or diagnostics apply.
- Confirm Privacy policy URL and Developer contact before Play Console use.
- Confirm which app config is authoritative for release: root `app.json`, `apps/mobile/app.json`, or a future generated config.
