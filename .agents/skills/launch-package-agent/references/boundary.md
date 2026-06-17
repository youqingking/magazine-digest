# launch-package-agent Boundary Reference

Use this reference when changing launch package aggregation, validator binding, or workflow step behavior.

## Skill-owned responsibility

- Aggregate the current run's upstream agent outputs.
- Preserve RED/YELLOW blockers and human review gates.
- Never rewrite upstream missing, unknown, blocked, or needs_human results into ready or submit-ready claims.

## Canonical runtime

- Validator: `play-store-launch/validators/validate_launch_package_agent.py`
- Skill wrapper: `.agents/skills/launch-package-agent/scripts/validate.py`
- Workflow owner: `play-store-launch/workflow/`

## Evidence boundary

Do not move or copy app-owned source facts into this skill. Read current-run outputs and evidence only:

- `artifacts/play-store-launch/<run-id>/steps/**`
- current run `evidence-ledger.jsonl`
- current run `launch-readiness.json`

## Shared logic boundary

Do not copy model clients, evidence helpers, status rules, renderers, or shared validators into this skill. Keep shared code in `play-store-launch/shared/`.
