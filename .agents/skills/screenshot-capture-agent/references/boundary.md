# screenshot-capture-agent Boundary Reference

Use this reference when changing screenshot capture checks, validator binding, or workflow step behavior.

## Skill-owned responsibility

- Attempt or explicitly block real Android screenshot capture.
- Record device, route, locale, commit, and capture blockers.
- Never fabricate screenshots or treat storyboard plans as captured PNG evidence.

## Canonical runtime

- Validator: `play-store-launch/validators/validate_screenshot_capture_agent.py`
- Skill wrapper: `.agents/skills/screenshot-capture-agent/scripts/validate.py`
- Workflow owner: `play-store-launch/workflow/`

## Evidence boundary

Do not move or copy app-owned source facts into this skill. Read them as evidence only:

- `docs/launch/screenshots/**`
- `artifacts/screenshots/**` only when real capture creates files
- `apps/mobile/**`

## Shared logic boundary

Do not copy model clients, evidence helpers, status rules, renderers, or shared validators into this skill. Keep shared code in `play-store-launch/shared/`.
