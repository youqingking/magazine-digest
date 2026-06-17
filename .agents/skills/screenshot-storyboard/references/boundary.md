# screenshot-storyboard Boundary Reference

Use this reference when changing screenshot storyboard planning, validator binding, or workflow step behavior.

## Skill-owned responsibility

- Prepare screenshot storyboard and shot-list drafts.
- Bind every shot to real routes, scenarios, and evidence.
- Keep public asset selection, visual review, trademark review, and capture approval human-review-required.

## Canonical runtime

- Validator: `play-store-launch/validators/validate_screenshot_storyboard.py`
- Skill wrapper: `.agents/skills/screenshot-storyboard/scripts/validate.py`
- Workflow owner: `play-store-launch/workflow/`

## Evidence boundary

Do not move or copy app-owned source facts into this skill. Read them as evidence only:

- `docs/launch/screenshots/**`
- `docs/launch/google-play/**`
- `apps/mobile/**`

## Shared logic boundary

Do not copy model clients, evidence helpers, status rules, renderers, or shared validators into this skill. Keep shared code in `play-store-launch/shared/`.
