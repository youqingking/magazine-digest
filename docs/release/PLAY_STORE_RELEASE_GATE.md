# Play Store Release Gate

## Status

本文件是 `release-build-agent` 的 M2 harness claim 报告，结论限定为 no-credential `dry-run` evidence。它不是 Google Play submission 判断，也不是发布授权。

`release_status`: `blocked`

原因：本地 repo 命令证据显示 mobile shell 的依赖安装、typecheck、fixture smoke、Expo start smoke 和 preflight 可以通过；但没有真实 Android release build、EAS build、signing key、Play Console app 或 rollout evidence。所有 release / store / credential / submission 相关判断仍是 `human review required`。

Machine-readable output: `docs/release/release-build-agent-output.json`

## Harness Claim Summary

| harness claim | claim_class | status | value | evidence_refs | human gate |
| --- | --- | --- | --- | --- | --- |
| `rba.c0.npm_ci_pass` | `C0` | `observed_in_repo` | `npm.cmd ci` passed with exit code 0 | `evidence.rba.npm_ci` | no |
| `rba.c0.typecheck_pass` | `C0` | `observed_in_repo` | `npm.cmd --prefix apps/mobile run typecheck` passed | `evidence.rba.typecheck` | no |
| `rba.c0.fixture_smoke_pass` | `C0` | `observed_in_repo` | fixture smoke passed and Supabase seam stayed unavailable without env | `evidence.rba.smoke_fixture` | no |
| `rba.c0.start_smoke_pass` | `C0` | `observed_in_repo` | Expo start smoke passed with local fixture scenario | `evidence.rba.start_smoke` | no |
| `rba.c0.preflight_pass` | `C0` | `observed_in_repo` | repo preflight passed | `evidence.rba.preflight` | no |
| `rba.c4.android_release_build_blocked` | `C4` | `blocked` | signed Android build / Play upload evidence missing | `evidence.rba.android_build_missing` | yes |
| `rba.c5.play_console_credentials_blocked` | `C5` | `blocked` | Play Console credentials and production action are not available or allowed | `evidence.rba.play_console_missing` | yes |

## Command Evidence

| Command | Result | Evidence notes |
| --- | --- | --- |
| `npm.cmd ci` | pass | install completed; vulnerability warnings remain non-release blockers for owner triage |
| `npm.cmd --prefix apps/mobile run typecheck` | pass | `tsc --noEmit` completed |
| `npm.cmd --prefix apps/mobile run smoke:fixture` | pass | `MOBILE_FIXTURE_READER_SMOKE_PASSED`; `product_key=demo_cn_content`; Supabase `status=unavailable reason=missing_env` |
| `npm.cmd --prefix apps/mobile run start:smoke` | pass | `MOBILE_EXPO_START_SMOKE_PASSED`; `expo_url=http://localhost:19001`; `fixture_scenario=s01_normal_full_matrix` |
| `npm.cmd run validate:preflight` | pass | repo preflight completed under current M2 working tree |

## Blocked Release Items

- Android build: `blocked` because no signed AAB/APK or EAS build evidence exists.
- EAS: `needs_human` for owner/projectId/build profile and release source-of-truth.
- Android package: `needs_human` because `apps/mobile/app.json` lacks production `android.package`.
- signing: `needs_human`; no keystore or service account material is allowed in repo.
- Play Console: `blocked`; no Play Console app/account evidence exists and API use is not approved.
- Privacy policy URL, Developer contact, Data safety, listing, screenshots, target audience, content rating, track and rollout remain `human review required`.

## Human Approval Gate

`C4` / `C5` release and production-action claims must stay behind `docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md`. This M2 output may be used as L2 evidence input for later review, but it must not trigger credentials, Play Console API, EAS submit, or rollout work.
