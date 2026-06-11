---
name: repo-audit
description: Read-only repository audit skill for collecting evidence, migration boundaries, command safety, and NEED_HUMAN items before implementation work.
---

# Repo Audit

## Use When

Use this skill when an agent needs to understand the current repository state,
map migration boundaries, classify command safety, or prepare an implementation
thread without changing app behavior.

## Inputs

- Current repository files.
- Existing governance docs.
- Git status and recent commits.
- Explicit user scope and allowed paths.

## Procedure

1. Read `AGENTS.md`, `docs/harness/HARNESS_LANDING_PLAN.md`, and
   `docs/harness/EXISTING_PROJECT_AUDIT.md` first when present.
2. Inspect with read-only commands such as `rg --files`, `git status --short`,
   and targeted file reads.
3. Record facts with file evidence, command evidence, or an explicit
   `NEED_HUMAN` marker.
4. Classify any proposed command as read-only, writes reports only, mutates
   generated state, mutates runtime state, requires credentials, or requires
   desktop tools.
5. Stop before app source, schema, dependency, deployment, auth, payment,
   subscription, or push changes unless a separate implementation thread permits
   them.

## Output

Return a compact audit note with:

- Facts observed.
- Risks or migration boundaries.
- Safe commands.
- Unsafe or deferred commands.
- Remaining `NEED_HUMAN` items.
