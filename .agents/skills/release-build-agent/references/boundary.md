# release-build-agent Boundary Reference

Use this reference when changing the release build readiness skill, validator binding, or workflow step.

## Skill-owned responsibility

- Explain Android release build readiness evidence.
- Keep EAS, signing, Play Console, track, and rollout items fail-closed until human evidence exists.
- Produce draft readiness evidence only.

## Canonical runtime

- Validator: `play-store-launch/validators/validate_release_build_agent.py`
- Skill wrapper: `.agents/skills/release-build-agent/scripts/validate.py`
- Workflow owner: `play-store-launch/workflow/`

## Evidence boundary

Do not move or copy app-owned source facts into this skill. Read them as evidence only:

- `docs/release/**`
- `docs/launch/**`
- `apps/mobile/**`
- `package.json`

## Shared logic boundary

Do not copy model clients, evidence helpers, status rules, renderers, or shared validators into this skill. Keep shared code in `play-store-launch/shared/`.
