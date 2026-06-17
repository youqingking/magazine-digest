# Screenshot Human Review Required

## Status

This file records the screenshot storyboard human gate for M2. It is planning evidence only; no raw screenshot capture is created by this agent.

## Required Review

| Gate | Status | Evidence |
| --- | --- | --- |
| real device or emulator capture | `human review required` | `docs/launch/screenshots/shot-list.json` |
| image spec | `human review required` | Google Play screenshot size, aspect ratio, safe-area, crop and status-bar decisions are not in repo evidence |
| content authorization | `human review required` | fixture text, article content, publication names and visual copy need rights review |
| public shot selection | `NEED_HUMAN` | `/debug` is internal evidence by default |
| Play Console use | `NEED_HUMAN` | Play Console action remains out of scope |

## Guardrails

- Do not fabricate screenshots.
- Do not create raw screenshot files in M2.
- Do not show unavailable features.
- Do not use nonexistent routes.
- Do not claim screenshots captured.
