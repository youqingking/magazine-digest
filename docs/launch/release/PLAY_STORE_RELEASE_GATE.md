# PLAY_STORE_RELEASE_GATE

## Status

本文件是 Play Store release build dry-run gate，用于 Play Store launch preparation MVP 的人工审查准备。它不是 Google Play submission，也不是发布授权。所有 Play developer account、Android package、EAS owner/projectId、signing、release track、production access、submission/rollout 判断均为 `NEED_HUMAN` / `human review required`。

本轮 `release-build-agent` 结论：本地 Expo runtime shell 可以完成 no-credential build smoke、typecheck、fixture smoke、Expo start smoke 和 repo preflight；真实 Android release build / Play upload 仍为 `blocked`，不得声称 approved、ready to submit 或 submission ready。

## Gate Summary

| Gate | Current Status | Evidence | Review |
| --- | --- | --- | --- |
| Expo runtime shell exists | pass | `apps/mobile/**`, `apps/mobile/package.json` | human review required |
| Local Expo export build smoke | pass | `npm.cmd exec expo export -- --platform android --output-dir ../../tmp/release-build-agent/expo-export`, exit 0 from `apps/mobile`; exported Android bundle to ignored `tmp/` evidence path | human review required |
| Android release build artifact | blocked | No `eas build` / signed AAB/APK was produced in this no-credential run | NEED_HUMAN |
| TypeScript typecheck | pass | `npm.cmd --prefix apps/mobile run typecheck`, exit 0 | human review required |
| Fixture smoke | pass | `MOBILE_FIXTURE_READER_SMOKE_PASSED`; current fixture `product_key=demo_cn_content`, scenario `data2_multi_publication_release_candidate`, articles=30, surfaces=30 | human review required |
| Expo start smoke | pass | `MOBILE_EXPO_START_SMOKE_PASSED`; `expo_url=http://localhost:19001`; fixture scenario `s01_normal_full_matrix` | human review required |
| Repo preflight | pass | `npm.cmd run validate:preflight`, exit 0 | human review required |
| Android package | blocked | `apps/mobile/app.json` does not define production `android.package` | NEED_HUMAN |
| EAS owner/projectId | blocked | No human-approved owner/projectId/build profile in launch docs | NEED_HUMAN |
| Signing key / keystore | blocked | No credential material allowed in repo | NEED_HUMAN |
| Play Console app | blocked | No Play Console app evidence in repo | NEED_HUMAN |
| Privacy policy | blocked | Missing public URL | NEED_HUMAN |
| Data safety | draft | `docs/launch/google-play/data-safety-draft.md`, `docs/launch/google-play/data-safety-evidence.md` | human review required |
| Listing metadata | draft | `docs/launch/google-play/listing.*.json` | human review required |
| Screenshots | draft | Storyboard and shot-list only; no public screenshot assets | human review required |
| Submission / rollout | blocked | Explicitly out of scope for this MVP | NEED_HUMAN |

## Dry-Run Commands

These commands are allowed for no-credential readiness evidence:

```powershell
python scripts/agent_tools/validate_release_build_agent.py .
python scripts/agent_tools/validate_play_store_agent_mvp.py .
npm.cmd exec expo export -- --platform android --output-dir ../../tmp/release-build-agent/expo-export
npm.cmd --prefix apps/mobile run typecheck
npm.cmd --prefix apps/mobile run smoke:fixture
npm.cmd --prefix apps/mobile run start:smoke
npm.cmd run validate:preflight
git diff --check
git status --short
```

## Forbidden Commands

Do not run these in this MVP:

- `eas submit`
- Google Play API submission
- Play Console edit commit
- Production track rollout
- Credential upload or production signing setup
- Any command that writes real Supabase, RevenueCat, Push, Play Console, or signing credentials

## Generated Output Policy

If a dry-run command modifies generated outputs, identify the changed path and restore it unless the current goal explicitly asks to commit that generated output. This refresh wrote Expo export evidence only under `tmp/release-build-agent/expo-export`, an ignored local dry-run path. A mistaken outside-workspace temporary `G:\tmp\release-build-agent` path from the first failed export attempt was verified and removed.

## NEED_HUMAN

- Confirm Android package id.
- Confirm EAS owner/projectId/build profile and signing policy.
- Confirm Google Play developer account and app.
- Provide Privacy policy URL and Developer contact.
- Review Data safety answers and SDK inventory against the release artifact.
- Review listing copy, trademarks, screenshots, target audience, content rating, release track, submission, and rollout.
