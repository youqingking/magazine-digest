# PR Title

Harvest no-credential Expo Phase A factory assets

## Scope Summary

This PR narrows `codex/phase-a-factory-assets` to the Phase A Harvest assets
needed for future no-credential Expo-first runtime foundations. It keeps the
reusable foundation pattern, reuse guide, efficiency baseline, one Codex goal
prompt, one local no-credential skill, two validators, triage/scope docs, this
PR body, a minimal agent-registry update, and local-generated ignore hygiene.

No app behavior, dependencies, credentials, fixture source data, generated
runtime output, service setup, production config, or broader old packs are
adopted.

## Exact Files Intended For Review

```text
.gitignore
.agents/skills/no-credential-expo-foundation/SKILL.md
.agents/skills/no-credential-expo-foundation/agents/openai.yaml
codex_prompts/FACTORY_GOAL_NO_CREDENTIAL_EXPO_FOUNDATION.md
docs/agents/AGENT_REGISTRY.md
docs/factory/APP_FACTORY_PHASE_A_REUSE_GUIDE.md
docs/factory/NO_CREDENTIAL_EXPO_RUNTIME_FOUNDATION_PATTERN.md
docs/factory/PHASE_A_EFFICIENCY_BASELINE.md
docs/factory/PHASE_A_HARVEST_PR_BODY.md
docs/factory/PHASE_A_HARVEST_PR_SCOPE.md
docs/factory/UNTRACKED_FACTORY_ARTIFACT_TRIAGE.md
scripts/agent_tools/validate_factory_phase_a_assets.py
scripts/agent_tools/validate_phase_a_harvest_pr_scope.py
```

## Non-Goals

- No `apps/mobile/**` or `packages/core-runtime/**` behavior changes.
- No package manifest or lockfile changes.
- No real Supabase credentials, SDK setup, CLI link, applied migration, auth
  provider, storage, edge function, or production config.
- No RevenueCat, price, quota, free-limit, subscription-benefit, entitlement, or
  service-sync setup.
- No push credential setup, token registration, Expo Push, FCM/APNs, or
  notification provider setup.
- No external content pipeline, PDF parsing, web scraping, prompt generation,
  markdown production, or pipeline scheduling.
- No fixture source data edits or generated runtime outputs.
- No legacy `mobile/`, `uniCloud/`, or `admin/` behavior changes.
- No broader App Factory, launch, ASO, privacy, eval, screenshot, launch
  package, or Agno pack adoption.

## Excluded Artifacts

- Removed root generated-style output and placeholders: `artifacts/**`,
  `docs/architecture/.gitkeep`, `docs/brand/.gitkeep`,
  `docs/market/.gitkeep`.
- Removed broader App Factory skills and prompts outside
  `.agents/skills/no-credential-expo-foundation/**` and
  `codex_prompts/FACTORY_GOAL_NO_CREDENTIAL_EXPO_FOUNDATION.md`.
- Removed broad harness-pack docs under `docs/factory/**` and `docs/harness/**`
  that are not required for this Phase A foundation harvest.
- Removed launch/product/privacy/eval/store/screenshot templates and tools.
- Kept Agno orchestration, connector, dependency, and runtime assets excluded
  for a separate owner-approved thread.

## Validation Evidence

- `python scripts/agent_tools/validate_factory_phase_a_assets.py .` passed:
  `checked_factory_assets=5`, `checked_required_terms=13`.
- `python scripts/agent_tools/validate_phase_a_harvest_pr_scope.py .` passed:
  `checked_intended_files=13`, `untracked_artifact_candidates=0`.
- `npm.cmd ci` passed. It reported existing peer/deprecation warnings and
  `31 moderate severity vulnerabilities`; no dependency changes were made for
  this PR.
- `npm.cmd --prefix apps/mobile run typecheck` passed.
- `npm.cmd --prefix apps/mobile run smoke:fixture` passed, including expected
  Supabase seam status `unavailable` with `reason=missing_env`.
- `npm.cmd --prefix apps/mobile run start:smoke` passed and reported
  `expo_url=http://localhost:19001`.
- `npm.cmd run validate:preflight` passed and reported a clean worktree on
  `codex/phase-a-factory-assets`.
- `git diff --check` passed.
- `git diff --name-status origin/main...HEAD` showed
  exactly the 13 intended files.
- `git status --short` was clean.

## Remaining Risks

- Broader App Factory, launch, ASO, privacy, eval, harness-pack, and Agno assets
  may still be useful, but they are intentionally deferred.
- This PR records reusable no-credential patterns only; real Supabase,
  RevenueCat, push, store, EAS, production product keys, prices, quotas, and
  credentials still require human-owned implementation threads.

## Reviewer Checklist

- Confirm the PR diff contains exactly the files listed above.
- Confirm `.gitignore` only adds `tmp/`, `__pycache__/`, and `*.pyc`.
- Confirm excluded artifacts are absent from the final diff.
- Confirm no app behavior, dependency, lockfile, credential, generated runtime
  output, fixture source, legacy behavior, or production config changes landed.
- Confirm `product_key` remains a required cross-project contract.
- Confirm validation evidence is current and honestly reports any failures or
  generated-output restore actions.

## Follow-Up Artifact Adoption Thread

Open separate owner-approved adoption threads if any excluded material is still
wanted:

- App Factory skill pack and prompt pack adoption.
- Harness pack and inactive CI-template adoption.
- Launch, ASO, privacy, screenshot, and store metadata tooling adoption.
- Agent eval and scorecard adoption.
- Agno connector, dependency, orchestration, and shared-pack adoption.
