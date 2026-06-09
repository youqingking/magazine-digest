# Stage D Decisions

## Scope freeze

- Stage D in this repository is limited to backend/admin foundation, not mobile business implementation.
- Runtime delivery is `fixture-backed / local-runtime-first`.
- No real uniCloud credentials, payment, push, webhook, reward grant, or referral settlement is implemented.

## Backend runtime shape

- `backend/` is the single Stage D local runtime root.
- Layers are fixed as:
  - contract surface
  - repository / adapter
  - fixture-backed adapter
  - runtime config
  - guard / validation

## Admin track shape

- Generated resources stay schema-driven.
- Manual modules stay limited to workflow-heavy shells.
- Stage C shell is extended in place instead of rewritten.

## Contract freeze

- Stage B schema and canonical rules remain unchanged:
  - timezone = `Asia/Shanghai`
  - money unit = `fen`
  - discount = `price_multiplier_basis_points`
  - reward = `vip_days`

## uniCloud alignment

- `database/*.schema.json` remains canonical.
- `mobile/uniCloud-aliyun/database/` is synced by script, never hand-maintained.
