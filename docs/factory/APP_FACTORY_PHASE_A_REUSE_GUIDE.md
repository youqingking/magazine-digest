# App Factory Phase A Reuse Guide

## Purpose

Use this guide to apply the Phase A no-credential Expo runtime foundation to a new app with the same basis: Expo, React Native, TypeScript, Expo Router, npm workspaces, Supabase as future backend, RevenueCat as future subscription authority, and Expo Push first with a future FCM/APNs seam.

The goal is to copy the foundation pattern, not Magazine Digest product behavior.

## Copy

Copy these asset classes into the new repo or branch:

- Runtime boundary docs for external pipeline, standardized package, app runtime, Supabase, RevenueCat, notifications, and legacy reference policy.
- Content package and runtime fixture contract docs.
- Command safety matrix, generated-output mutation profile, and runtime command runbook.
- Expo shell structure under `apps/mobile` only when the new goal is explicitly allowed to scaffold or copy app source.
- Shared runtime port and fixture adapter shape under `packages/core-*` only when implementation is in scope.
- No-credential Supabase env contract and fail-closed seam pattern.
- Local validators under `scripts/agent_tools/**`.
- Release gate docs and PR checklist shape.
- App factory docs, Codex goal prompt, and local skill from this harvest.

When the target task is docs-only, copy only docs, prompts, skills, and validators.

## Rename

Rename app-specific identifiers before implementation:

- App display name.
- npm package names.
- Expo slug, scheme, owner, and project identity.
- Android package and iOS bundle identifier.
- Repository title and release doc titles.
- Local fixture scenario labels if the target app has different fixture coverage.
- `product_key` fixture values and product labels.
- Domain language such as publication, article, issue, digest, or reading mode only when the target product truly uses a different object model.

Do not rename generic seam names such as runtime repository, fixture adapter, Supabase seam, entitlement seam, notification seam, or generated-output restore rules unless the target repo already uses stronger names.

## Regenerate

Regenerate only deterministic or target-specific outputs:

- `package-lock.json` through npm commands when package manifests change.
- Runtime fixture bundles from the target app's canonical fixture source.
- Validation reports created by target validation commands.
- Expo config values from the target account and store decisions.
- Release evidence after commands run in the target repo.

Do not regenerate fixture source data or external content packages inside the app repo. The external pipeline remains outside.

## App-Specific

Keep these decisions app-specific:

- Product key namespace and product catalog.
- Content object vocabulary and variant selection rules beyond the shared package contract.
- Entitlement IDs, offering IDs, store product IDs, prices, benefits, free quotas, and RevenueCat project mapping.
- Supabase org/project, region, project ref, URL, anon or publishable key policy, service-role secret owner, auth provider, and RLS harness owner.
- Push credential owner, Expo Push versus direct FCM/APNs timing, and notification delivery provider.
- EAS owner, bundle identifiers, package identifiers, store accounts, and release tracks.
- Legacy retention or archive policy.

These must remain explicit human decisions, not factory defaults.

## Product Key Changes

Every future app must review each `product_key` surface:

- Fixture source metadata.
- Generated runtime bundle metadata.
- App view model fields such as `productKey`.
- Runtime repository context.
- Supabase schema and RLS contracts.
- Entitlement snapshots.
- Notification inbox, preferences, deliveries, and sync cursors.
- Pricing, quota, campaign, promo, referral, reward, profile, and experiment previews.
- Event and metric payloads.

Local demo values are allowed only as synthetic no-credential fixture data. Production product keys must come from approved config or backend state, never from a silent app default.

## What Not To Generalize

Do not generalize:

- Magazine Digest copy, content taxonomy, publication semantics, fixture scenario names, or sample data.
- Expo canary version choice without a fresh dependency decision.
- npm audit warning acceptance.
- Supabase draft SQL as applied migration SQL.
- RevenueCat identifiers, store product IDs, or entitlement benefits.
- Push credential strategy.
- Any price, quota, free limit, feature flag, experiment parameter, operational threshold, or risk threshold.
- Generated runtime outputs.
- Legacy DCloud, uni-app, uniCloud, or admin behavior.

## Reuse Procedure

1. Start from a clean worktree or scoped `codex/` branch.
2. Read the target repo's `AGENTS.md`, `README.md`, `docs/NEED_HUMAN.md`, package manifests, and runtime boundary docs.
3. Copy or author the factory docs before touching app behavior.
4. Rename app identity and fixture product scope in docs first.
5. Add validators before running broader commands.
6. Run no-credential validation only.
7. Restore generated-output churn unless the target goal explicitly commits regenerated output.
8. Report changed files, commands, results, reusable pieces, app-specific decisions, and remaining `NEED_HUMAN`.

## Acceptance

A reused Phase A foundation is acceptable only when it remains no-credential, fixture-default, product-scoped, and explicit about every service seam and generated-output mutation.
