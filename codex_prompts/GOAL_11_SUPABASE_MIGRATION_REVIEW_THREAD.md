# Goal 11: Supabase Migration Review Thread

## Status

Future read-only goal. Do not execute during the Mobile Runtime Foundation PR readiness gate.

## Purpose

Review the draft Supabase runtime schema and RLS artifacts before any migration implementation, project connection, SDK dependency, or credential setup.

## Starting Context

Use the worktree and branch selected by the human for the future review. Read first:

- `AGENTS.md`
- `docs/NEED_HUMAN.md`
- `docs/architecture/SUPABASE_RUNTIME_DATA_BOUNDARY.md`
- `docs/architecture/SUPABASE_SCHEMA_CONTRACT.md`
- `docs/architecture/SUPABASE_RLS_CONTRACT.md`
- `docs/architecture/SUPABASE_DRAFT_REVIEW_HANDOFF.md`
- `docs/mobile/SUPABASE_ENV_CONTRACT.md`
- `docs/mobile/SUPABASE_ADAPTER_IMPLEMENTATION_PLAN.md`
- `infra/supabase/drafts/runtime-schema-draft.sql`
- `infra/supabase/drafts/runtime-rls-draft.sql`
- Legacy reference schemas under `uniCloud/database/**` as read-only migration evidence only.

## Allowed Work

- Read-only audit of draft schema and RLS files.
- Compare draft contracts against legacy reference semantics.
- Identify missing product scope, user ownership, fail-closed, service-role-only, and test coverage risks.
- Produce review notes, migration blockers, and recommended draft edits.
- Update docs only if the human explicitly asks for review-note persistence.

## Forbidden Work

- Do not apply SQL to Supabase.
- Do not create files under `infra/supabase/migrations/**`.
- Do not add Supabase credentials, project config, CLI config, or SDK dependencies.
- Do not implement the mobile Supabase adapter.
- Do not add RevenueCat, push, analytics, production config, feature flag, experiment, quota, price, entitlement, or risk-threshold logic.
- Do not mutate fixture source data or generated runtime outputs.

## Required Review Output

Return a concise review report with:

- Schema findings ordered by severity.
- RLS findings ordered by severity.
- Product key and user ownership coverage.
- Service-role-only write boundary risks.
- Tests required before migration.
- `NEED_HUMAN` decisions still blocking migration.
- Recommended next implementation goal, if review finds the drafts acceptable.

## Suggested Verification

Run read-only/local checks only:

```powershell
python scripts/agent_tools/validate_supabase_runtime_contract.py .
python scripts/agent_tools/validate_mobile_runtime_foundation_pr.py .
git status --short
```

If any command is blocked by missing local tools, classify as `tool_missing` or `environment_blocked`. Do not fake success.
