# Stage D Local Runtime

## Purpose

- Provide a local, fixture-backed backend contract runtime when full uniCloud or HBuilderX conditions are unavailable.

## Runtime mode

- Default mode: `local_fixture_backed`
- Default fixture source: `fixtures/db/seed/*.json`
- Default product: `demo_cn_content`

## Guarantees

- Surface names stay aligned with Stage D foundation naming.
- Response semantics stay aligned with Stage B contracts and docs.
- Canonical constants stay frozen to `Asia/Shanghai`, `fen`, `price_multiplier_basis_points`, and `vip_days`.

## Non-goals

- No real billing write path
- No real entitlement settlement
- No real webhook processing
- No real referral or reward runtime

## Smoke output

- `node backend/cli.mjs` writes `output/stage-d/backend-smoke.json` for local verification.
