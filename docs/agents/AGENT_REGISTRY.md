# Agent Registry

## Purpose

This registry defines the first minimal agent harness for the existing migration
project. It is additive documentation and local skill metadata only; it does not
change app behavior, runtime state, package scripts, dependencies, deployment
settings, schema, auth, payment, or push code.

## Operating Role

Default project role: `Repo Bootstrap Agent + Migration Architect`.

Primary responsibility:

- Keep the repository moving toward an Expo-first executable starting point.
- Prefer governance, directory boundaries, migration notes, scripts, and
  validation over business feature work.
- Preserve the current legacy `mobile/`, `uniCloud/`, and `admin/` directories
  as migration references until a separate cleanup goal is approved.

## Core Local Skills

These harness and factory-harvest skills are active in the current narrow
landing layer:

| Skill | Path | Purpose |
| --- | --- | --- |
| `repo-audit` | `.agents/skills/repo-audit/SKILL.md` | Read-only repository fact gathering and risk mapping. |
| `owner-card` | `.agents/skills/owner-card/SKILL.md` | Compact ownership cards for repo areas, decisions, and blockers. |
| `reality-object-compiler` | `.agents/skills/reality-object-compiler/SKILL.md` | Convert observed facts into evidence-backed reality objects. |
| `no-credential-expo-foundation` | `.agents/skills/no-credential-expo-foundation/SKILL.md` | Create or audit reusable no-credential Expo runtime foundation assets. |

## Boundaries

Agents using this harness must not:

- Modify app source code during harness bootstrap.
- Modify database schema.
- Modify package dependencies or production configuration.
- Modify deployment settings.
- Modify auth, payment, subscription, or push code.
- Implement content production pipelines inside this repository.

All critical product, pricing, entitlement, feature flag, experiment, operations,
and risk-control data must preserve `product_key` as a first-class dimension.

## Validation

Minimal harness validation is:

```powershell
python scripts/agent_tools/validate_harness_minimal.py .
```

The minimal validator checks required harness files, confirms the approved core
local skills are present, and verifies current git changes are limited to
harness-allowed paths.

Phase A factory-harvest validation is:

```powershell
python scripts/agent_tools/validate_factory_phase_a_assets.py .
python scripts/agent_tools/validate_phase_a_harvest_pr_scope.py .
```
