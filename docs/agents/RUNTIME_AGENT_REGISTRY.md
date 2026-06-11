# Runtime Agent Registry

## Purpose

Define the agent ownership model for the Magazine Digest runtime object contract. This registry is documentation-only and does not change app behavior, package scripts, dependencies, schema, auth, payment, push, or production configuration.

## Runtime Contract Agent

| Field | Value |
| --- | --- |
| area | Runtime object contract |
| owner_role | Repo Bootstrap Agent + Migration Architect |
| status | active |
| product_key_support | required |
| allowed_paths | `docs/product/**`, `docs/architecture/**`, `docs/harness/**`, `docs/agents/**`, `.agents/skills/runtime-object-contract/**`, `scripts/agent_tools/**`, `codex_prompts/**` |
| blocked_by | None for docs-only contract freeze |
| evidence | `README.md`, `AGENTS.md`, `docs/harness/EXISTING_PROJECT_AUDIT.md`, `docs/harness/HARNESS_LANDING_PLAN.md` |

## Runtime Shell Agent

| Field | Value |
| --- | --- |
| area | Expo-first mobile runtime shell |
| owner_role | Future Expo implementation agent |
| status | proposed |
| product_key_support | required |
| allowed_paths | Future implementation should land under `apps/mobile` and `packages/core-*`; not active in this contract thread |
| blocked_by | Expo/EAS identity confirmation, package-manager policy, first runtime package acceptance target |
| evidence | `README.md`, `apps/mobile/README.md`, `docs/NEED_HUMAN.md` |

## External Pipeline Boundary Agent

| Field | Value |
| --- | --- |
| area | External content pipeline boundary |
| owner_role | External pipeline owner |
| status | active outside repo |
| product_key_support | required |
| allowed_paths | None in this app repo for pipeline implementation |
| blocked_by | Final package manifest schema and provenance requirements |
| evidence | `README.md`, `AGENTS.md`, `docs/product/CANONICAL_OBJECT_CONTRACT.md` |

## Supabase Runtime Data Agent

| Field | Value |
| --- | --- |
| area | Supabase auth and runtime data seam |
| owner_role | Future Supabase implementation agent plus human service owner |
| status | blocked |
| product_key_support | required |
| allowed_paths | Future implementation should land under `infra/supabase` and `packages/core-*`; not active in this contract thread |
| blocked_by | Supabase organization, project, environment, and secret strategy |
| evidence | `docs/NEED_HUMAN.md`, `docs/harness/EXISTING_PROJECT_AUDIT.md` |

## RevenueCat Agent

| Field | Value |
| --- | --- |
| area | Subscription and entitlement seam |
| owner_role | Future RevenueCat implementation agent plus human subscription owner |
| status | blocked |
| product_key_support | required |
| allowed_paths | Future adapter and contract paths only after explicit implementation goal |
| blocked_by | RevenueCat project, app, product, entitlement, and webhook mapping |
| evidence | `docs/NEED_HUMAN.md`, `docs/harness/EXISTING_PROJECT_AUDIT.md` |

## Notifications Agent

| Field | Value |
| --- | --- |
| area | Expo Push, notification preferences, inbox, and future FCM/APNs seam |
| owner_role | Future notifications implementation agent plus human credential owner |
| status | blocked |
| product_key_support | required |
| allowed_paths | Future adapter and contract paths only after explicit implementation goal |
| blocked_by | Push credential ownership and Expo Push versus direct APNs/FCM timing |
| evidence | `docs/NEED_HUMAN.md`, `docs/harness/EXISTING_PROJECT_AUDIT.md` |

## Legacy Reference Agent

| Field | Value |
| --- | --- |
| area | Legacy `mobile/`, `uniCloud/`, and `admin/` reference review |
| owner_role | Migration reference reviewer |
| status | deferred |
| product_key_support | present |
| allowed_paths | Read-only reference unless a future explicit migration or cleanup goal changes scope |
| blocked_by | Human decision on legacy retention horizon |
| evidence | `README.md`, `AGENTS.md`, `docs/NEED_HUMAN.md`, `docs/harness/EXISTING_PROJECT_AUDIT.md` |

## Agent Rules

- Do not implement app source behavior from this registry.
- Do not add Expo config, dependencies, database schema, auth, payment, push, or production config changes in contract-freeze threads.
- Do not implement content ingestion, PDF parsing, web scraping, prompt generation, markdown generation, or pipeline scheduling in this repository.
- Preserve `product_key` as a required design dimension for data, config, events, entitlements, notifications, experiments, and operations.
