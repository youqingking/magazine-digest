# Screenshot Validation Notes

## Status

This document is screenshot storyboard validation evidence for a `draft` planning package. It is not public screenshot asset review, not a Google Play submission decision, and not approval to use screenshots in Play Console.

Screenshot image files, real device capture, device specs, cropping, visual QA, trademark review, content authorization, Google Play image spec review, and public asset selection are `NEED_HUMAN` / `human review required`.

## Current Route Boundary

| Route | Allowed use | Evidence | Public screenshot status |
| --- | --- | --- | --- |
| `/` | Public candidate storyboard | `apps/mobile/app/index.tsx` | `human review required` |
| `/article/[articleId]` | Public candidate storyboard | `apps/mobile/app/article/[articleId].tsx` | `human review required` |
| `/debug` | Internal evidence only | `apps/mobile/app/debug.tsx` | `NEED_HUMAN` before public use |

## Fixture And Capture Notes

- Preferred controlled capture scenario: `s01_normal_full_matrix`.
- Preferred article id: `art_s01_city_signals`.
- The app defaults to fixture runtime data and must not silently claim live Supabase data.
- `npm.cmd --prefix apps/mobile run smoke:fixture` confirms the app fixture reader can load both `current` and `s01_normal_full_matrix`.
- An ad-hoc PowerShell JSON inspection was noisy around long fixture text, so it is not used as a gate. Before real capture, a human reviewer should still confirm the selected scenario renders in Expo and that visible text is readable and authorized.
- The `current` fixture may include real publication names and content-like text, so public screenshot use requires trademark/content authorization.

## Must Not Show

- Live Supabase sync.
- RevenueCat purchase, paywall, entitlement grant, prices, or quotas as a live purchase surface.
- Push notification permission, token registration, inbox, or delivery as a live user feature.
- Account sign-in.
- Cloud sync.
- Production content pipeline.
- Any claim that reserved seams are live.

## Screenshot Asset Policy

- No screenshot image files are created by this agent.
- No Play Console upload is attempted.
- No app source behavior is changed to accommodate screenshots.
- `/debug` remains internal evidence unless a human reviewer explicitly approves public use.

## Validator

```powershell
python scripts/agent_tools/validate_screenshot_storyboard.py .
```

`validate_screenshot_storyboard.py` must pass before these notes can be handed to human review.

## Validation Results For This Run

| Command | Classification | Result |
| --- | --- | --- |
| `python scripts/agent_tools/validate_screenshot_storyboard.py .` | `pass` | Screenshot storyboard validator passed. |
| `python scripts/agent_tools/validate_play_store_agent_mvp.py .` | `pass` | Aggregate Play Store agent MVP validator passed. |
| `npm.cmd --prefix apps/mobile run smoke:fixture` | `pass` | Fixture reader loaded `current` and `s01_normal_full_matrix`; Supabase seam returned `unavailable` / `missing_env`. |
| `git diff --check` | `pass` | No whitespace errors; Git printed LF-to-CRLF normalization warnings. |
| `git status --short` | `pass` | Shows only this screenshot-storyboard documentation/eval set as modified. |

## NEED_HUMAN

- Device type, OS version, viewport, screenshot dimensions, and capture tooling.
- Real device or emulator capture plan.
- Public shot selection and ordering.
- Screenshot crop / safe-area / status-bar treatment.
- Trademark and content authorization for publication names and article text.
- Google Play image spec review.
- Human approval before any screenshot is used in Play Console.
