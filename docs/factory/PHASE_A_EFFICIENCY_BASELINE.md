# Phase A Efficiency Baseline

## Purpose

Record what Phase A produced so future same-basis Expo runtime apps can reuse the foundation with less discovery, fewer validation mistakes, and clearer no-credential boundaries.

## Goal Count

Observed Phase A goal count: 11.

Evidence limit: this branch retains `codex_prompts/GOAL_11_SUPABASE_MIGRATION_REVIEW_THREAD.md`, and release docs describe the completed no-credential foundation plus the dependent Supabase review candidate PR. Prompts for goals 1 through 10 are not persisted here, so the count is recorded by final visible goal index rather than by a complete prompt archive.

## Major Validators

Phase A's reusable validator set includes:

- `scripts/agent_tools/validate_mobile_runtime_foundation_pr.py`
- `scripts/agent_tools/validate_mobile_runtime_shell.py`
- `scripts/agent_tools/validate_mobile_dependency_workflow.py`
- `scripts/agent_tools/validate_runtime_data_port.py`
- `scripts/agent_tools/validate_supabase_runtime_contract.py`
- `scripts/agent_tools/validate_pr_stack_integration_gate.py`
- `scripts/agent_tools/validate_command_safety_matrix.py`
- `scripts/agent_tools/validate_content_runtime_contract.py`
- `scripts/agent_tools/validate_runtime_object_contract.py`
- `scripts/agent_tools/validate_factory_phase_a_assets.py`

The high-value command gates are:

- `npm.cmd ci`
- `npm.cmd --prefix apps/mobile run typecheck`
- `npm.cmd --prefix apps/mobile run smoke:fixture`
- `npm.cmd --prefix apps/mobile run start:smoke`
- `npm.cmd run validate:preflight`
- `git diff --check`
- `git status --short`

## Reusable Modules

Future same-basis apps can reuse these module patterns:

- Repo boundary docs for external content pipeline separation.
- Runtime object and content package contract.
- Generated-output mutation profile and restore recipes.
- Command safety matrix and runtime command runbook.
- Expo Router shell route shape for home, article, and debug surfaces.
- npm workspace dependency workflow.
- Runtime data port interfaces.
- Fixture reader and fixture adapter approach.
- Fail-closed Supabase seam and public env contract.
- Draft-only Supabase schema and RLS review workflow.
- Release PR body, merge decision, stacked gate, and reviewer checklist pattern.
- Codex goal prompt and local skill for future factory reuse.

## Non-Reusable Decisions

These Phase A decisions must remain app-specific:

- Magazine Digest name, copy, content taxonomy, article semantics, and fixture scenario content.
- Expo owner, slug, project id, Android package, iOS bundle identifier, and EAS setup.
- Expo canary dependency acceptance and npm audit warning acceptance.
- Supabase org/project, region, URL, anon or publishable key, auth policy, migration application policy, service-role secret owner, and local RLS harness owner.
- RevenueCat project/app mapping, entitlement ID, offering ID, store product IDs, webhook secret owner, and subscription benefit model.
- Google Play and App Store setup.
- Push credential owner and Expo Push versus direct FCM/APNs timing.
- Product key namespace and production product catalog.
- Prices, quotas, free limits, feature flags, experiment parameters, operational thresholds, and risk thresholds.
- Legacy retention or archive policy.

## Expected Reuse Percentage

Expected reuse for a future same-basis app: 65% to 75%.

The reusable portion is mostly governance, command safety, fixture-default runtime architecture, dependency workflow, validation scripts, and fail-closed service seam design. The non-reusable portion is product identity, account ownership, store/subscription setup, fixture source content, production product keys, and any real service integration.

For another magazine-style digest app using the same standardized package shape, reuse can approach 80%. For a different content domain that still uses Expo, Supabase, RevenueCat, and runtime fixtures, expect closer to 60% because the package vocabulary, scenarios, and UI copy need more replacement.

## Efficiency Expectations

Compared with Phase A, future same-basis apps should need:

- Less boundary discovery because the runtime, package, generated-output, and service seams are already named.
- Fewer command retries because mutation profiles and restore recipes are documented.
- Less validation design because validators can be copied and renamed.
- Faster PR review because non-goals and reviewer checklists are already structured.
- Clearer handoff to humans because `NEED_HUMAN` categories are established.

## Baseline Caveats

This baseline does not authorize service setup or migration application. It measures reuse for a no-credential foundation only. Any app that needs live Supabase, RevenueCat, push, stores, analytics, or production deployment must open a separate implementation phase with fresh human decisions and validation.
