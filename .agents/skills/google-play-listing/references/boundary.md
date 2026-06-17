# google-play-listing Boundary Reference

Use this reference when changing listing draft behavior, validator binding, or workflow step behavior.

## Skill-owned responsibility

- Prepare Google Play listing drafts and field-length validation evidence.
- Keep category, content rating, target audience, trademark, policy, privacy URL, and developer contact decisions human-review-required.
- Never produce Play Store final, approved, submitted, or ready-to-submit claims.

## Canonical runtime

- Validator: `play-store-launch/validators/validate_google_play_listing.py`
- Skill wrapper: `.agents/skills/google-play-listing/scripts/validate.py`
- Workflow owner: `play-store-launch/workflow/`

## Evidence boundary

Do not move or copy app-owned source facts into this skill. Read them as evidence only:

- `docs/launch/**`
- `docs/mobile/**`
- `apps/mobile/**`
- `package.json`

## Shared logic boundary

Do not copy model clients, evidence helpers, status rules, renderers, or shared validators into this skill. Keep shared code in `play-store-launch/shared/`.
