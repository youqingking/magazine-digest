# Stage UI3 TabBar Audit

## Audit Scope

- `mobile/pages.json`
- official page routes under `mobile/pages/*`
- alias routes:
  - `pages/inbox/index`
  - `pages/follows/index`
  - `pages/campaign/index`
- navigation calls that still depend on `switchTab`

## Audited Old Shell

- Previous tabBar count: `5`
- Previous tabBar routes:
  - `pages/feed/index`
  - `pages/search/index`
  - `pages/paywall/index`
  - `pages/invite/index`
  - `pages/profile/index`
- Previous problem:
  - page-level Stitch merge had already landed
  - but `paywall` and `invite` were still mounted in the bottom shell
  - runtime therefore showed “new page content + old five-button shell”

## Official Pages

- `pages/feed/index`
- `pages/search/index`
- `pages/detail/index`
- `pages/paywall/index`
- `pages/invite/index`
- `pages/profile/index`
- `pages/settings/index`

## Alias / Internal Capability Pages

- `pages/inbox/index`
- `pages/follows/index`
- `pages/campaign/index`

## Pages Previously Treated As Tab Pages But No Longer Eligible

- `pages/paywall/index`
- `pages/invite/index`

These pages remain official pages, but they no longer belong in the bottom shell.

## UI3 Target Shell

- Final tabBar count: `3`
- Final tabBar routes:
  - `pages/feed/index`
  - `pages/search/index`
  - `pages/profile/index`

## Navigation Risks Found During Audit

- `pages/campaign/index` previously used `switchTab("/pages/paywall/index")`
  - this becomes invalid once `paywall` leaves tabBar
- `paywall` and `invite` needed visible non-tab entry points after shell convergence
- `settings` was already non-tab and still had a valid `navigateTo` path from `profile`

## UI3 Resolution Summary

- Remove `paywall` and `invite` from `tabBar`
- Keep `detail` and `settings` as non-tab official pages
- keep `inbox/follows/campaign` as alias or internal capability routes only
- move `campaign` alias to non-tab redirect behavior
- add explicit non-tab entry points:
  - `feed -> paywall`
  - `profile -> paywall`
  - `profile -> invite`
  - `profile -> settings`
  - `paywall -> invite`
