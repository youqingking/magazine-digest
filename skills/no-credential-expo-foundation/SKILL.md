---
name: no-credential-expo-foundation
description: Create or audit a no-credential Expo-first runtime foundation for app-factory repos. Use when a user asks Codex to reproduce, harvest, validate, or review the Phase A Expo runtime foundation, including fixture-default Expo Router shell boundaries, runtime data ports, command safety, generated-output hygiene, fail-closed Supabase seams, Codex goal packs, or factory reuse docs.
---

# No-Credential Expo Foundation

## Workflow

1. Read `AGENTS.md`, `README.md`, `docs/NEED_HUMAN.md`, factory docs, mobile/runtime/content docs, Supabase contract docs, package manifests, and existing validators before editing.
2. Confirm the task is no-credential and factory/governance scoped. If real Supabase, RevenueCat, push, store, EAS production config, dependency changes, app behavior, fixture source data, or generated outputs are requested, require an explicit implementation goal.
3. Preserve `product_key` through every runtime, content, entitlement, notification, event, fixture, and Supabase contract surface.
4. Keep fixture mode as the default data source. Explicit Supabase mode must fail closed when env or implementation is missing and must not fall back to fixtures.
5. Add or update docs, prompts, local skills, and narrow validators before any implementation thread.
6. Run only no-credential validation and restore validation-only generated output.

## Audit Checklist

- Runtime object and repository boundary are documented before code changes.
- External content production remains outside the app repo: no PDF parsing, web scraping, prompt generation, markdown generation, package production, or scheduling.
- Standardized package and fixture contracts identify source fixtures, generated runtime outputs, and restore rules.
- Command safety docs classify read-only, report-mutating, generated-output-mutating, runtime-state-mutating, credential-required, desktop-tool, and unsafe-without-human commands.
- Expo shell docs name Expo Router routes, fixture source, missing/empty/ready/unavailable states, and service seams.
- Dependency workflow uses npm workspaces, `npm.cmd` commands, and lockfile alignment.
- Runtime data ports separate app routes from fixture and future service sources.
- Supabase seam has public env names, `connects: false`, missing-env unavailable behavior, and no SDK or real credentials.
- PR gate requires validation evidence and clean generated-output hygiene.

## Creation Checklist

- Create or update `docs/factory/NO_CREDENTIAL_EXPO_RUNTIME_FOUNDATION_PATTERN.md`.
- Create or update `docs/factory/APP_FACTORY_PHASE_A_REUSE_GUIDE.md`.
- Create or update a compact factory Codex goal under `codex_prompts/**`.
- Create or update this local skill under `.agents/skills/no-credential-expo-foundation/SKILL.md`.
- Create or update `scripts/agent_tools/validate_factory_phase_a_assets.py`.
- Record efficiency baseline and non-reusable app-specific decisions under `docs/factory/**`.
- Update `docs/agents/AGENT_REGISTRY.md` when local skill inventory changes.

## Validation

Run the factory validator first:

```powershell
python scripts/agent_tools/validate_factory_phase_a_assets.py .
```

When the target repo includes the mobile shell, run the no-credential runtime gate:

```powershell
npm.cmd ci
npm.cmd --prefix apps/mobile run typecheck
npm.cmd --prefix apps/mobile run smoke:fixture
npm.cmd --prefix apps/mobile run start:smoke
npm.cmd run validate:preflight
git diff --check
git status --short
```

For this skill folder itself, validate structure with:

```powershell
python C:/Users/Administrator/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/no-credential-expo-foundation
```

## Stop Conditions

Stop and report `NEED_HUMAN` when:

- A command asks for real credentials, cloud project access, store setup, production config, or service mutation.
- Generated-output commands touch fixture source data or app behavior unexpectedly.
- Any live Supabase, RevenueCat, push, auth, payment, analytics, or production SDK integration appears in a no-credential goal.
- The same command class fails three consecutive times.
- The target app identity, `product_key`, Supabase project, RevenueCat mapping, push owner, or EAS/store ownership is unknown and needed for the requested work.
