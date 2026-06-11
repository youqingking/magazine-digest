# Content Runtime Agent Registry

## Purpose

Define the narrow agent roles allowed to maintain the content package contract, runtime fixture contract, product-key guardrails, and scenario matrix. This registry is documentation-only and does not change app behavior, package scripts, dependencies, schema, auth, payment, push, production config, or legacy behavior.

## Allowed Narrow Skills

Only these narrow skills are in scope for this registry:

| Skill | Scope | Allowed Paths |
| --- | --- | --- |
| `content-package-contract` | Maintain the standardized content package input contract and external pipeline boundary. | `docs/content/**`, `docs/architecture/CONTENT_PIPELINE_HANDOFF.md`, `.agents/skills/content-package-contract/**`, `codex_prompts/**` |
| `runtime-fixture-contract` | Maintain source/generated fixture boundaries and mobile runtime fixture export rules. | `docs/runtime/**`, `docs/harness/**`, `.agents/skills/runtime-fixture-contract/**`, `scripts/agent_tools/**`, `codex_prompts/**` |
| `product-key-guardian` | Review docs and future implementation plans for first-class `product_key` support. | `docs/content/**`, `docs/runtime/**`, `docs/architecture/**`, `docs/agents/**`, `codex_prompts/**` |
| `scenario-matrix-reviewer` | Review scenario family coverage against runtime risks without changing fixture data content. | `docs/runtime/RUNTIME_SCENARIO_MATRIX.md`, `fixtures/test-inputs/**` read-only, `scripts/content/**` read-only |

## Content Package Contract Agent

| Field | Value |
| --- | --- |
| area | Standardized content package input contract |
| status | active |
| product_key_support | required |
| primary_docs | `docs/content/CONTENT_PACKAGE_CONTRACT.md`, `docs/architecture/CONTENT_PIPELINE_HANDOFF.md` |
| source_evidence | `fixtures/test-inputs/**`, `scripts/content/**`, `docs/product/CANONICAL_OBJECT_CONTRACT.md`, `docs/architecture/RUNTIME_BOUNDARY.md` |
| forbidden | Implementing ingestion, PDF parsing, web scraping, prompt generation, markdown generation, or pipeline scheduling |

## Runtime Fixture Contract Agent

| Field | Value |
| --- | --- |
| area | Runtime fixture source/generated boundary |
| status | active |
| product_key_support | required |
| primary_docs | `docs/runtime/RUNTIME_FIXTURE_CONTRACT.md`, `docs/runtime/RUNTIME_SCENARIO_MATRIX.md` |
| source_evidence | `fixtures/test-inputs/**`, `output/test-input-pack/**`, `mobile/fixtures/runtime/**`, `scripts/content/**` |
| forbidden | Replacing existing content validators or hand-authoring generated fixture outputs |

## Product Key Guardian

| Field | Value |
| --- | --- |
| area | Product-scoped contract review |
| status | active |
| product_key_support | required |
| primary_docs | `docs/content/CONTENT_PACKAGE_CONTRACT.md`, `docs/runtime/RUNTIME_FIXTURE_CONTRACT.md`, `docs/architecture/CONTENT_PIPELINE_HANDOFF.md` |
| source_evidence | `README.md`, `AGENTS.md`, `docs/product/CANONICAL_OBJECT_CONTRACT.md`, `fixtures/test-inputs/manifests/test-pack.manifest.json` |
| forbidden | Allowing unscoped content, config, events, entitlements, experiments, notifications, quotas, pricing previews, campaigns, promos, referrals, or fixtures |

## Scenario Matrix Reviewer

| Field | Value |
| --- | --- |
| area | Synthetic scenario risk coverage |
| status | active |
| product_key_support | required |
| primary_docs | `docs/runtime/RUNTIME_SCENARIO_MATRIX.md` |
| source_evidence | `fixtures/test-inputs/manifests/scenario-index.json`, `fixtures/test-inputs/scenarios/*/scenario.meta.json`, `scripts/content/synthetic-test-pack-lib.mjs` |
| forbidden | Editing fixture content unless only fixing a documented validator/document mismatch |

## Registry Rules

- Keep these skills narrow.
- Do not add broad implementation agents to this registry.
- Do not authorize app source, Expo config, dependency, database schema, auth, payment, push, production config, or legacy behavior changes from this registry.
- Do not implement external content pipeline responsibilities in this repository.
- Preserve `product_key` as a first-class field across content, runtime metadata, events, config, fixtures, scenarios, and future implementation plans.
