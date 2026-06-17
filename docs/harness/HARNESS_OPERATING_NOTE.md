# Harness Operating Note

## Scope

This note is the operating boundary for the minimal harness landing. The harness
is intentionally small and observable: it adds documentation, local skill
definitions, and one read-only validation command without changing app behavior.

## Current Landing Layer

The minimal landing layer consists of:

- Existing repo instructions in `AGENTS.md`.
- Existing audit and landing plan under `docs/harness/`.
- Agent registry at `docs/agents/AGENT_REGISTRY.md`.
- Three local skills under `.agents/skills/`.
- Read-only validator at `scripts/agent_tools/validate_harness_minimal.py`.

## Rules

- Architecture changes remain document-first.
- Harness bootstrap does not write business features.
- Harness bootstrap does not scaffold the Expo app shell.
- Harness bootstrap does not add Supabase, RevenueCat, Expo Push, FCM/APNs,
  store, analytics, or credential wiring.
- Existing DCloud / uni-app / uniCloud code remains migration reference.
- External content production remains outside this app repository.

## Command Profile

Default minimal validation:

```powershell
python scripts/agent_tools/validate_harness_minimal.py .
```

The command is read-only and should run without external credentials, desktop
tools, package installation, or network access.

## Human Inputs Still Required

No new external blockers are introduced by this landing. Existing project-level
items in `docs/NEED_HUMAN.md` remain authoritative for account ownership,
credential strategy, cloud project decisions, and legacy retention decisions.

## No Behavior Change Statement

This harness layer does not touch app source, package dependencies, database
schema, production configuration, deployment settings, auth code, payment code,
or push code. It only adds governance and validation files inside the approved
harness paths.
