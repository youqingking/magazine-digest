# Phase A Harvest PR Scope

## Purpose

Define the exact file set and reviewer boundary for the narrow Phase A Harvest
PR from `codex/phase-a-factory-assets`.

This PR is no-credential Expo factory-harvest work only: reusable foundation
docs, one local skill, one Codex goal prompt, two validators, triage/scope docs,
and minimal local-generated ignore hygiene. It does not adopt broader App
Factory packs, launch packs, Agno orchestration, generated outputs, placeholder
directory scaffolding, app behavior, live service configuration, dependencies,
or production config.

## Evidence Snapshot

- Branch checked: `codex/phase-a-factory-assets`.
- Owner decision: narrow PR; do not adopt broader old packs now.
- Required comparison: `main...HEAD` for committed branch evidence, plus
  working tree checks before the cleanup checkpoint.
- Current untracked files: none at triage time; validation must reconfirm.
- Triage source: `docs/factory/UNTRACKED_FACTORY_ARTIFACT_TRIAGE.md`.
- PR body source: `docs/factory/PHASE_A_HARVEST_PR_BODY.md`.
- Agno extension paths from `b704dc1 chore: land app factory agno extension`
  remain excluded after the existing revert checkpoint.

## Exact Intended PR Files

These files are intentional narrow Phase A Harvest source assets:

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

No other file is intended for review in this PR.

## Explicit Non-Goals

- No product feature work.
- No `apps/mobile/**` source behavior changes.
- No `packages/core-runtime/**` behavior changes.
- No dependency installation or lockfile changes.
- No real Supabase credentials, SDK setup, CLI link, applied migration, auth
  provider, storage, edge function, or production config.
- No RevenueCat setup, entitlement grants, prices, quotas, free limits,
  subscription benefits, or service sync.
- No push credential setup, Expo Push token registration, FCM/APNs setup, or
  notification delivery provider.
- No external content pipeline work inside this repo.
- No fixture source data edits.
- No generated runtime outputs.
- No legacy `mobile/`, `uniCloud/`, or `admin/` behavior changes.
- No active `.github/workflows/**` CI changes.
- No launch, ASO, store metadata, privacy disclosure, screenshot storyboard,
  eval-pack, or launch-package adoption.
- No Agno dependency installation, `.mcp.json` adoption, real model calls,
  scheduler, monitor, or external action in the narrow Phase A Harvest PR.

## Files Intentionally Left Untracked

None.

If future untracked artifact paths appear under `.agents/skills/**`,
`docs/factory/**`, `docs/harness/**`, `docs/release/**`, `docs/agents/**`,
`docs/launch/**`, `codex_prompts/**`, `evals/**`, `requirements/**`,
`artifacts/**`, or `scripts/agent_tools/**`, classify them in
`docs/factory/UNTRACKED_FACTORY_ARTIFACT_TRIAGE.md` before PR review.

## Files Intentionally Ignored

The only local/generated ignores accepted by this triage are:

```text
tmp/
__pycache__/
*.pyc
```

Do not add ignore rules for candidate source assets just to hide uncertainty.

## Files Excluded From The Narrow PR

These file groups must remain absent from the final PR diff:

```text
artifacts/**
docs/architecture/.gitkeep
docs/brand/.gitkeep
docs/market/.gitkeep
.agents/skills/agent-*
.agents/skills/app-*
.agents/skills/architecture-planner/**
.agents/skills/aso-keyword-research/**
.agents/skills/google-play-listing/**
.agents/skills/harness-bootstrap/**
.agents/skills/launch-package/**
.agents/skills/mvp-scope/**
.agents/skills/privacy-disclosure-prep/**
.agents/skills/screenshot-storyboard/**
codex_prompts/00_* through codex_prompts/07_*
docs/agents/AGENT_IMPROVEMENT_LOG.md
docs/agents/AGENT_SCORECARD.md
docs/agents/APP_FACTORY_AGENT_TAXONOMY.md
docs/factory/APP_FACTORY_AGENTS_AGNO_ROLLOUT_UPDATE.md
docs/factory/codex_app_factory_harness_pack_v0_1/**
docs/factory/APP_FACTORY_SHARED_ASSET_BOUNDARY.md
docs/factory/codex_app_factory_agno_extension_pack_v0_1/**
docs/factory/codex_app_factory_harness_agno_pack_v0_1/**
docs/harness/AGENT_LIFECYCLE.md
docs/harness/CODEX_OPERATION_PROTOCOL.md
docs/harness/FIRST_CODEX_LANDING_PACKET.md
docs/harness/GOVERNANCE.md
docs/harness/HARNESS_ASSET_MAP.md
docs/harness/HARNESS_OPERATING_MANUAL.md
docs/harness/SOURCES.md
docs/launch/**
docs/privacy/DATA_INVENTORY_TEMPLATE.md
docs/product/APP_SPEC_TEMPLATE.md
docs/product/LAUNCH_INFO_TEMPLATE.md
docs/release/PRELAUNCH_CHECKLIST.md
evals/agents/**
evals/agno_workflows/**
requirements/agno*.txt
.agents/skills/agno-*
.mcp.json
AGNO_EXTENSION_MANIFEST.md
README_AGNO_EXTENSION.md
agno_app_factory/**
docs/agno/**
scripts/agent_tools/agno_smoke_run.py
scripts/agent_tools/build_launch_package.py
scripts/agent_tools/check_keyword_bytes.py
scripts/agent_tools/scan_privacy_usage.py
scripts/agent_tools/validate_agno_extension.py
scripts/agent_tools/validate_apple_metadata.py
scripts/agent_tools/validate_google_play_listing.py
scripts/agent_tools/validate_harness_assets.py
scripts/agent_tools/validate_screenshot_storyboard.py
```

These artifacts may be useful later, but they need a separate owner-approved
adoption thread.

## Reviewer Checklist

- Confirm the final PR diff contains exactly the files listed in
  `Exact Intended PR Files`.
- Confirm `docs/factory/UNTRACKED_FACTORY_ARTIFACT_TRIAGE.md` states that the
  current untracked set is empty and classifies excluded artifact groups.
- Confirm broader App Factory, launch, ASO, privacy, eval, generated output,
  placeholder, and Agno paths are absent from the PR diff.
- Confirm `.gitignore` only adds local/generated ignores for `tmp/`,
  `__pycache__/`, and `*.pyc`.
- Confirm no credentials, production endpoints, prices, quotas, entitlements,
  feature flags, experiments, operational thresholds, or risk thresholds were
  introduced.
- Confirm `product_key` remains a cross-project contract and is not replaced by
  a production default.
- Confirm validation output was reported honestly and generated-output mutation
  was restored or explicitly recorded.

## Validation

Run:

```powershell
python scripts/agent_tools/validate_factory_phase_a_assets.py .
python scripts/agent_tools/validate_phase_a_harvest_pr_scope.py .
npm.cmd ci
npm.cmd --prefix apps/mobile run typecheck
npm.cmd --prefix apps/mobile run smoke:fixture
npm.cmd --prefix apps/mobile run start:smoke
npm.cmd run validate:preflight
git diff --check
git status --short
```
