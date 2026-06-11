# Supabase Adapter Implementation Plan

## Purpose

Define how a future Supabase adapter will implement the runtime data ports after Supabase ownership is resolved. This is a plan only; fixture mode remains the default and the current Supabase seam remains fail-closed.

## Current State

`packages/core-runtime/src/runtime-data-port.ts` defines:

- `RuntimeContentRepository`
- `RuntimeScenarioRepository`
- `RuntimeEntitlementRepository`
- `RuntimeNotificationRepository`

`packages/core-runtime/src/adapters/runtime-fixture-adapter.ts` is the default implementation. `packages/core-runtime/src/seams/supabase-seam.ts` is a no-credential seam with `connects: false` and unavailable responses. `apps/mobile/src/runtime/runtime-data-source.ts` selects fixture mode unless `EXPO_PUBLIC_RUNTIME_DATA_SOURCE=supabase` is explicitly set.

No real Supabase connection, SDK dependency, project config, migration, or secret should be added before `docs/NEED_HUMAN.md` Supabase ownership is resolved.

## Preconditions

Future implementation must not begin until these are documented:

- Supabase org/project owner.
- Environment ownership and secret injection policy.
- Auth provider and user identity policy.
- Migration application policy.
- RLS review against `docs/architecture/SUPABASE_RLS_CONTRACT.md`.
- Schema review against `docs/architecture/SUPABASE_SCHEMA_CONTRACT.md`.
- Service-owned write path for content projections, entitlement snapshots, and notification inbox creation.

## Dependency Policy

Do not add the Supabase JavaScript SDK in this draft. A future implementation may add it only after the preconditions are met and the dependency change is recorded in the thread report.

Until then:

- Fixture adapter remains the runtime default.
- Supabase adapter remains a seam.
- Missing or placeholder env returns unavailable.
- Supabase mode does not fall back to fixture data.

## RuntimeContentRepository

Future Supabase implementation should:

1. Require explicit `productKey` from `RuntimeRepositoryContext` or `EXPO_PUBLIC_PRODUCT_KEY`.
2. Fail closed when `productKey`, Supabase URL, anon key, or authenticated session requirements are missing.
3. Query public published content projections by `product_key`:
   - `runtime.products`
   - `runtime.publications`
   - `runtime.articles`
   - `runtime.article_variants`
   - `runtime.content_change_log`
4. Query user-private overlays only for authenticated users:
   - `runtime.user_content_state`
   - `runtime.user_follows`
5. Map returned rows into the existing `RuntimeShellState` shape rather than changing route code first.
6. Treat `premium_tier` as an access hint only; entitlement authority comes from the entitlement repository.
7. Preserve fail-closed behavior for unknown statuses, missing product scope, RLS denial, network failure, and schema mismatch.

Forbidden in this adapter:

- External content ingestion.
- PDF parsing.
- Web scraping.
- Prompt-to-content production.
- Markdown production.
- Pipeline scheduling.
- Client-side service writes to content projection tables.

## RuntimeScenarioRepository

Production runtime scenario selection should remain fixture-only unless a future QA goal explicitly introduces a Supabase-backed scenario catalog.

If implemented, it must:

- Be product-scoped by `product_key`.
- Be marked non-production/internal QA metadata.
- Not produce content or ingest source material.
- Not replace fixture mode as the default local harness path.

## RuntimeEntitlementRepository

Future Supabase implementation should read `runtime.entitlement_snapshot` as a RevenueCat-derived projection only.

Rules:

- Client writes are forbidden.
- Snapshot rows are scoped by `product_key` and `user_id`.
- Missing auth returns unavailable.
- Missing snapshot returns a conservative unavailable or inactive state, not a client grant.
- Prices, free quotas, plan benefits, and entitlement grants must not be hardcoded in the mobile client.

## RuntimeNotificationRepository

Future Supabase implementation should read and update only user-owned notification runtime state:

- Read `runtime.notification_inbox` by `product_key` and `user_id`.
- Update own read/archive state only after RLS review.
- Read or update `runtime.runtime_sync_cursors` for notification cursor state if needed.

It must not:

- Store Expo Push, FCM, or APNs credentials in the mobile repo.
- Create inbox records for arbitrary users from the client.
- Implement campaign delivery or push provider setup.

## Implementation Phases

### Phase 1: Contract Verification

- Keep fixture mode default.
- Run `python scripts/agent_tools/validate_supabase_runtime_contract.py .`.
- Confirm no real credentials, applied migrations, or Supabase SDK dependency were added.

### Phase 2: Adapter Skeleton

- Replace internals of `createSupabaseRuntimeRepository` behind the existing port shape.
- Preserve `connects: false` until a real query is implemented and verified.
- Keep unavailable states for missing env/session/product_key.

### Phase 3: Read-Only Content Queries

- Add read-only public content queries for published projections.
- Verify anon and authenticated reads through RLS tests.
- Keep user-private state unavailable until auth ownership is verified.

### Phase 4: Authenticated Private Reads

- Add owner-only reads for user content state, follows, notification inbox, entitlement snapshot, and cursors.
- Test authenticated owner, authenticated non-owner, wrong product_key, missing product_key, and anon denial.

### Phase 5: Limited User Writes

- Add only documented owner writes for reading state, follows, notification read/archive state, and cursors.
- Do not add content, entitlement, or notification creation writes to the client.

## Completion Criteria

The future adapter is acceptable only when:

- Fixture mode still works and remains default.
- Supabase mode fails closed on missing env, missing auth, missing product_key, RLS denial, and schema mismatch.
- Product-scoped queries include `product_key`.
- User-private queries include `user_id` ownership through RLS and adapter context.
- No secrets are committed.
- No migrations are applied from draft files without a dedicated migration goal.
