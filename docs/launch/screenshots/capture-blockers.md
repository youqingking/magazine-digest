# Screenshot Capture Blockers

## Status

`capture_status=blocked`

The blocker is evidence-bound: `adb devices` returned no attached Android device rows.

No attached Android device was available for this run.

## Blockers

| blocker_id | status | evidence | owner action |
| --- | --- | --- | --- |
| `sca.blocker.no_attached_android_device` | `blocked` | `adb devices` -> no attached device rows | Provide emulator/device or approve alternate capture route |
| `sca.blocker.public_asset_review` | `needs_human` | `docs/launch/screenshots/screenshot-human-review-required.md` | Review image specs and public use |
| `sca.blocker.content_authorization` | `needs_human` | `docs/launch/screenshots/shot-list.json` | Review fixture text and publication labels |

## Guardrails

- Do not fabricate screenshots.
- Do not treat storyboard or shot-list as captured images.
- Do not create raw screenshot files when `capture_status=blocked`.
- Do not show unavailable features.
- Do not call Play Console.
