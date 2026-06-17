# privacy-disclosure-prep Boundary Reference

Use this reference when changing privacy disclosure preparation, validator binding, or workflow step behavior.

## Skill-owned responsibility

- Prepare privacy disclosure and Data Safety draft evidence.
- Keep legal, privacy, SDK, children/family, ads, tracking, and submission-sensitive conclusions human-review-required.
- Never produce a legal final or privacy-approved claim.

## Canonical runtime

- Validator: `play-store-launch/validators/validate_privacy_disclosure_prep.py`
- Skill wrapper: `.agents/skills/privacy-disclosure-prep/scripts/validate.py`
- Workflow owner: `play-store-launch/workflow/`

## Evidence boundary

Do not move or copy app-owned source facts into this skill. Read them as evidence only:

- `docs/privacy/**`
- `docs/launch/**`
- `apps/mobile/**`
- `package.json`

## Shared logic boundary

Do not copy model clients, evidence helpers, status rules, renderers, or shared validators into this skill. Keep shared code in `play-store-launch/shared/`.
