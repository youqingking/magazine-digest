# Supabase Review Dependent PR Plan

## Status

`codex/supabase-migration-review` should still target `codex/expo-shell-foundation` until the foundation merges.

Current branch evidence:

- Foundation head: `55478976061c5b6ecd83346f29733f7fbedcaa3c`.
- Supabase review head: `e28613509019deb12538ee8b47eb345cf333836f`.
- Current merge-base: `406ccf014d210cbfc7c451569463433bf7f58957`, so the dependent branch has not yet been refreshed onto the lockfile repair commit.
- The dependent branch's three-dot diff against `codex/expo-shell-foundation` is still review-only: `docs/NEED_HUMAN.md`, `docs/supabase/**`, `infra/supabase/reviewed-candidates/**`, and `scripts/agent_tools/validate_supabase_migration_review.py`.
- A virtual merge with the repaired foundation exits 0 and does not change `apps/mobile/package.json` or `package-lock.json`.

## Targeting Decision

Keep the dependent PR targeted to `codex/expo-shell-foundation` while the foundation is unmerged. Do not retarget it to current `main` before the foundation lands, because that would mix the mobile runtime foundation and Supabase review material into one broad review surface.

After `codex/expo-shell-foundation` merges to `main`, retarget or rebase `codex/supabase-migration-review` to `main`. If the PR UI or CI requires exact ancestry before then, refresh the dependent branch by merging or rebasing foundation commit `5547897` into it, but keep the final diff review-only.

## Candidate Boundary

The SQL under `infra/supabase/reviewed-candidates/**` is review material only.

It must not be treated as migration material yet because:

- Candidate files are not under `infra/supabase/migrations/**`.
- No Supabase org/project owner has approved a target.
- No secret or environment injection owner has approved credential handling.
- No auth provider or `auth.uid()` identity mapping has been approved.
- No migration naming and application policy has been approved.
- No local RLS harness has proven anon, owner, non-owner, wrong product, missing product, missing auth, and service-role-only behavior.
- Open product and payload decisions can still change schema and policy shape before migration.

## Dependent Validation Evidence

The dependent branch validator is not present on `codex/expo-shell-foundation@5547897`, so it was run in the existing `codex/supabase-migration-review` worktree.

| Command | Status | Evidence |
| --- | --- | --- |
| `python scripts/agent_tools/validate_supabase_migration_review.py .` | Passed on `codex/supabase-migration-review@e286135` | `SUPABASE_MIGRATION_REVIEW_VALIDATION_PASSED`; checked 8 files and 10 tables. |
| `git status --short` | Clean before and after dependent validator | No generated output or candidate churn. |
| `git merge-tree --write-tree codex/expo-shell-foundation codex/supabase-migration-review` | Passed | Produced tree `005dbad4f44c3ae654ad26e6032007e890e33057`. |

## What Must Wait for Human Approval

- Supabase org/project selection and project lifecycle owner.
- Local and production environment ownership, including anon key and service-role secret handling.
- Auth provider selection and user identity mapping for `auth.uid()`.
- Product context source for RLS and runtime queries.
- Migration naming, local-only test path, and remote application policy.
- Service-owned writer deployment boundary, audit behavior, and secret owner.
- RevenueCat sync ownership for `runtime.entitlement_snapshot`.
- Push and notification ownership for inbox creation and delivery state.
- Notification read/archive mutation mechanism.
- Public-safe change-log payload contract.
- Local RLS harness ownership and seed fixture ownership.

## Open Decisions

| Decision | Current gate conclusion |
| --- | --- |
| `product_key` RLS context | Open. The reviewed candidate is intended to fail closed, but humans must approve JWT claim, request header, RPC parameter, or another source. |
| Premium body exposure | Open. Public `runtime.article_variants` reads may expose premium bodies unless entitlement gating or body separation is approved. |
| Notification read/archive mutation | Open. Client update must wait for RPC or column-level grants so title/body/data/delivery fields cannot be mutated. |
| Public-safe change-log payload | Open. Public sync needs an approved payload contract and seed rows proving private/operator data stays hidden. |
| Local RLS harness ownership | Open. A human must assign the owner for local CLI setup, seed data, test execution, and evidence retention. |

## Dependent PR Review Checklist

- Target `codex/supabase-migration-review` to `codex/expo-shell-foundation` until the foundation merges.
- Confirm the PR remains docs/review/candidate-only.
- Confirm reviewed candidates stay under `infra/supabase/reviewed-candidates/**`.
- Confirm no files are added to `infra/supabase/migrations/**`, `infra/supabase/applied/**`, or `supabase/migrations/**`.
- Confirm no Supabase CLI commands requiring credentials were run.
- Confirm `docs/NEED_HUMAN.md` records all human decisions that block real Supabase work.
- Confirm the future local RLS harness covers anon, authenticated owner, authenticated non-owner, wrong `product_key`, missing `product_key`, missing auth, and service-role-only cases.

## Explicit Non-Goals

- No applied migrations.
- No remote Supabase project link.
- No project ids, URLs, anon keys, service-role secrets, or local credential files.
- No mobile Supabase adapter implementation.
- No RevenueCat sync implementation.
- No push provider implementation.
- No external content pipeline or fixture source data changes.
