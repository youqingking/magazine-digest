# google-data-safety-agent Boundary Reference

Use this reference when changing Google Play Data Safety draft behavior, validator binding, or workflow step behavior.

## Skill-owned responsibility

- Prepare Data Safety evidence drafts from repo evidence.
- Explain unknown and needs_human fields.
- Never turn unknown data collection, sharing, SDK, children/family, ads, tracking, or security answers into no-data-collected claims.

## Canonical runtime

- Validator: `play-store-launch/validators/validate_google_data_safety_agent.py`
- Skill wrapper: `.agents/skills/google-data-safety-agent/scripts/validate.py`
- Workflow owner: `play-store-launch/workflow/`

## Evidence boundary

Do not move or copy app-owned source facts into this skill. Read them as evidence only:

- `docs/privacy/**`
- `docs/launch/**`
- `apps/mobile/**`
- `package.json`

## Shared logic boundary

Do not copy model clients, evidence helpers, status rules, renderers, or shared validators into this skill. Keep shared code in `play-store-launch/shared/`.
