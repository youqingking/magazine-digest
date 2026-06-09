# Stage UI3 Entrypoints

## Feed

- article click -> `detail`
- topbar paywall CTA -> `paywall`
- topbar search CTA -> `search`
- inbox summary focus stays on `feed`

## Detail

- article remains on unique `detail`
- entitlement / quota CTA -> `paywall`
- back -> previous page or `feed`

## Search

- remains the only formal search/filter/follow page
- `follows` alias lands here

## Paywall

- reachable from:
  - `feed`
  - `profile`
  - `detail`
  - `campaign` alias
- keeps offer / quota / promo / campaign surfaces
- exposes invite CTA -> `invite`

## Invite

- reachable from:
  - `profile`
  - `paywall`
- keeps invite summary / reward summary / redeem preview placeholder

## Profile

- tabBar entry remains
- reachable actions:
  - paywall
  - invite
  - settings
  - inbox summary handoff to feed

## Settings

- reachable from `profile`
- keeps runtime / auth / device / push / build audit surfaces
