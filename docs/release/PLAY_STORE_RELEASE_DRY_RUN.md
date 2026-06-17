# Play Store Release Dry-Run

## 本轮结论

`release-build-agent` 本轮只执行 no-credential dry-run。当前 Expo-first mobile shell 的本地验证信号为：build smoke pass、typecheck pass、smoke pass、preflight pass、release agent validator pass。

这不等于 Google Play submission approval，也不等于 ready to submit。真实 Android release build、签名、EAS project/owner、Play Console app、release track、privacy/legal/listing/screenshot 审查仍为 `blocked` / `NEED_HUMAN` / `human review required`。

## Purpose

本文件记录 `release-build-agent` 的 no-credential release dry-run 范围。它不替代 `docs/launch/release/PLAY_STORE_RELEASE_GATE.md`，不执行 `eas submit`，不执行 Google Play API submission，也不授权 Play Console 操作。

## Dry-Run Boundary

Allowed:

- Read Expo config, mobile package scripts, runtime docs, and launch readiness docs.
- Run local validators, typecheck, fixture smoke, start smoke, and preflight.
- Record `pass`, `fail`, `blocked`, `tool_missing`, `environment_blocked`, and `NEED_HUMAN`.

Not allowed:

- `eas submit`
- Google Play API submission
- Production track rollout
- Adding or committing credentials
- Changing app source behavior to make a release gate pass

## Current Command Evidence

| Area | Command | Classification | Exit code | Key evidence |
| --- | --- | --- | --- | --- |
| Build smoke | `npm.cmd exec expo export -- --platform android --output-dir ../../tmp/release-build-agent/expo-export` from `apps/mobile` | pass | 0 | Android bundle export completed to `tmp/release-build-agent/expo-export`; this is not a signed release artifact |
| Release build artifact | `eas build` / signed AAB/APK | blocked | not run | Out of scope without human-approved Android package, EAS owner/projectId/build profile, and signing policy |
| Typecheck | `npm.cmd --prefix apps/mobile run typecheck` | pass | 0 | `tsc --noEmit` completed |
| Fixture smoke | `npm.cmd --prefix apps/mobile run smoke:fixture` | pass | 0 | `MOBILE_FIXTURE_READER_SMOKE_PASSED`; `product_key=demo_cn_content`; Supabase seam remains `unavailable` with `missing_env` |
| Expo start smoke | `npm.cmd --prefix apps/mobile run start:smoke` | pass | 0 | `MOBILE_EXPO_START_SMOKE_PASSED`; `expo_url=http://localhost:19001`; `fixture_scenario=s01_normal_full_matrix` |
| Preflight | `npm.cmd run validate:preflight` | pass | 0 | repo preflight completed on branch `refresh/play-store-launch-prep`; required paths present |
| Agent validator | `python scripts/agent_tools/validate_release_build_agent.py .` | pass | 0 | `RELEASE_BUILD_AGENT_VALIDATION_PASSED`; checked files=8 |

Note: an initial root-context Expo export attempt failed because Metro resolved Expo's default `AppEntry` instead of the `apps/mobile` Expo Router entry. The corrected command from `apps/mobile` passed and is the command to keep for this dry-run evidence.

## Release Blockers

| Blocker | Status | Why |
| --- | --- | --- |
| Android package id | NEED_HUMAN | `apps/mobile/app.json` has no production `android.package`. |
| EAS owner/projectId/build profile | NEED_HUMAN | No human-approved Expo/EAS project identity is present in launch docs. |
| Signing key / keystore policy | NEED_HUMAN | No credential material is allowed in repo; signing ownership must be decided externally. |
| Google Play developer account and app | NEED_HUMAN | No Play Console app evidence exists in repo. |
| Privacy policy URL and developer contact | NEED_HUMAN | Required for Play listing/Data safety submission, not available in repo. |
| Data safety, listing, screenshots, content rating, target audience | NEED_HUMAN | Current files are drafts/evidence only and need privacy/legal/store review. |
| Submission / rollout | NEED_HUMAN | Google Play submission, track rollout, and production release are explicitly out of scope. |

## Human Review Required

Android package, EAS owner/projectId, signing, Play Console app, Privacy policy URL, Developer contact, Data safety, listing, screenshots, content rating, trademark, submission, and rollout remain `NEED_HUMAN` / `human review required`.

## Not In This Run

- No `eas submit`.
- No Google Play API submission.
- No Play Console edit commit.
- No EAS credential setup, keystore upload, service account setup, Supabase credentials, RevenueCat credentials, or Push credentials.
- No app source, `package.json`, lockfile, production config, migration, or fixture source data changes.
- No claim of approved, final compliant, submission ready, or ready to submit.

## 下一步建议

1. 进入 `privacy-disclosure-prep` agent 前，保持本轮 release gate 的 `blocked` 边界不变。
2. 由人工确认 Android package、EAS owner/projectId/build profile、signing policy、Play Console app、privacy policy URL、developer contact。
3. 在 privacy agent 中只生成 Data safety / privacy evidence draft，并继续把法律、隐私、SDK、儿童/家庭、广告/追踪判断标记为 `NEED_HUMAN`。

## Handoff

从 `release-build-agent` 角度，可以进入下一个 agent：`privacy-disclosure-prep`。该 handoff 仅表示 release dry-run 文档和本地验证已可作为输入；不表示 Google Play submission 可以开始。
