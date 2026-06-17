# launch-info-collector Boundary Reference

Use this reference when changing launch source-of-truth collection, validator binding, or workflow step behavior.

## Skill-owned responsibility

- Collect Play Store launch fields from repo evidence.
- Mark unknown or missing store/account/legal/submission fields as needs_human.
- Never convert inferred fields into observed facts without evidence.

## Canonical runtime

- Validator: `play-store-launch/validators/validate_launch_info_collector.py`
- Skill wrapper: `.agents/skills/launch-info-collector/scripts/validate.py`
- Workflow owner: `play-store-launch/workflow/`

## Evidence boundary

Do not move or copy app-owned source facts into this skill. Read them as evidence only:

- `docs/launch/**`
- `apps/mobile/**`
- `README.md`
- `package.json`

## Shared logic boundary

Do not copy model clients, evidence helpers, status rules, renderers, or shared validators into this skill. Keep shared code in `play-store-launch/shared/`.
