# Play Store Launch Artifacts Policy

Generated launch-readiness runs belong under:

```text
artifacts/play-store-launch/<run-id>/
```

Runtime artifacts are not committed by default. They may be used as local validation evidence, but source changes should live in `play-store-launch/workflow/`, `play-store-launch/shared/`, `play-store-launch/validators/`, `play-store-launch/schemas/`, or `.agents/skills/<agent-name>/`.

Every generated run must stay fail-closed unless human approval evidence exists:

- `can_submit_google_play=false`
- `safe_to_strengthen_final_store_claims=false`
- Reality Gate remains `FAIL_CLOSED`
