# Factory Goal: No-Credential Expo Foundation

## Objective

Create or audit a reusable no-credential Expo-first runtime foundation for a same-basis app. Produce governance docs, factory reuse notes, local validators, and a fail-closed runtime seam plan without adding features, dependencies, credentials, applied migrations, production config, fixture source edits, or generated runtime outputs.

## Read First

- `README.md`
- `AGENTS.md`
- `docs/NEED_HUMAN.md`
- `docs/factory/NO_CREDENTIAL_EXPO_RUNTIME_FOUNDATION_PATTERN.md`
- `docs/factory/APP_FACTORY_PHASE_A_REUSE_GUIDE.md`
- `docs/mobile/**`
- `docs/runtime/**`
- `docs/content/**`
- `docs/architecture/SUPABASE_*`
- `scripts/agent_tools/**`
- `package.json`
- `apps/mobile/package.json` when present

## Allowed Work

- Add or update factory docs, release gate docs, local agent docs, Codex prompts, and narrow validators.
- Create or audit a local skill for the no-credential Expo foundation.
- Record `NEED_HUMAN` blockers for service ownership, credentials, store setup, migration application, and production identifiers.
- Run no-credential validation and restore validation-only generated output.

## Forbidden Work

- Do not change app source behavior unless a separate implementation goal explicitly permits it.
- Do not change package dependencies or hand-edit lockfiles.
- Do not add Supabase credentials, project config, SDK dependencies, CLI links, applied migrations, auth providers, storage, edge functions, or production config.
- Do not set up RevenueCat, prices, quotas, free limits, subscription benefits, entitlement grants, or service sync.
- Do not set up push credentials, token registration, FCM/APNs, or notification delivery providers.
- Do not edit fixture source data or commit generated runtime outputs.
- Do not implement PDF parsing, web scraping, prompt generation, markdown generation, package production, or pipeline scheduling inside the app repo.

## Required Assets

- Pattern doc for the no-credential Expo runtime foundation.
- Reuse guide for new same-basis apps.
- Compact Codex goal prompt.
- Local skill under `.agents/skills/no-credential-expo-foundation/SKILL.md`.
- Validator for required factory assets.
- Efficiency baseline covering observed goal count, validators, reusable modules, non-reusable decisions, and expected reuse percentage.

## Validation

Run what applies in the target repo, using Windows-safe commands when on PowerShell:

```powershell
python scripts/agent_tools/validate_factory_phase_a_assets.py .
npm.cmd ci
npm.cmd --prefix apps/mobile run typecheck
npm.cmd --prefix apps/mobile run smoke:fixture
npm.cmd --prefix apps/mobile run start:smoke
npm.cmd run validate:preflight
git diff --check
git status --short
```

Do not fake success. If commands mutate generated output, restore it unless the goal explicitly commits regenerated output.

## Completion Report

Report changed files, command results, generated-output restore actions, reusable assets created, what future apps can reuse, app-specific decisions that remain blocked, and the recommended next phase.
