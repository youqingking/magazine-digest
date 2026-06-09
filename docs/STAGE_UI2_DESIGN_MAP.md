# Stage UI2 Design Map

## Design Inputs

- The extracted handoff under `docs/design-handoff/stitch-ui1_5/` is the official Stage UI2 input.
- `docs/design-handoff/stitch-ui1_5/DESIGN.md`
- `docs/design-handoff/stitch-ui1_5/screen.html`
- `docs/design-handoff/stitch-ui1_5/screen-1.html`
- `docs/design-handoff/stitch-ui1_5/screen-2.html`
- `docs/design-handoff/stitch-ui1_5/screen-3.html`
- `docs/design-handoff/stitch-ui1_5/screen-4.html`
- `docs/design-handoff/stitch-ui1_5/screen-5.html`

## Official Page Mapping

| Frozen official page | Stitch handoff mapping | Mapping rule |
| --- | --- | --- |
| 首页 (`feed`) | `screen.html` | Primary home visual source |
| 文章详情页 (`detail`) | `screen-2.html` | Primary detail visual source |
| 搜索页 (`search`) | `screen-4.html` + `screen-1.html` | Search layout from `screen-4`; source/follow catalog language from `screen-1` |
| 订阅页 (`paywall`) | `screen-3.html` | Primary paywall visual source |
| 邀请/兑换页 (`invite`) | `screen-3.html` + `screen-5.html` | Reuse premium/account card language; no dedicated invite handoff exists |
| 我的页 (`profile`) | `screen-5.html` | Primary profile visual source |
| 设置页 (`settings`) | `screen-5.html` | Reuse account-management list language while preserving runtime/device/push sections |

## No Direct Hand-off Cases

- `invite` has no direct page-level handoff.
- `settings` has no direct page-level handoff.

## Alignment Rule For Missing Pages

- `invite` uses the same token system, card language, headline hierarchy, and CTA restraint as `screen-3` and `screen-5`.
- `settings` uses the account-surface shell from `screen-5`, but keeps foundation visibility from current implementation.

## What Cannot Be Adopted Literally

- Handoff bottom nav count and labels cannot override frozen 7-page IA.
- “来源” as a bottom-nav destination cannot create a new formal page outside frozen IA.
- Paywall screenshots cannot remove quota status, promo preview, or campaign context from Stage G.
- Profile/account drafts cannot hide auth/session/device summaries required by H0 / H1a.
- Detail visuals cannot introduce summary truncation, step cards, reading progress gamification, or multi-route reading.

## Foundation Surfaces That Must Remain Visible

- Home: inbox summary entry, followed updates, continue reading, saved/resume surfaces
- Detail: unavailable/cached/error states, audience safety boundary, entitlement/quota display-only snapshot
- Search: follow catalog and search results
- Paywall: offer summary, quota status, promo preview, campaign context
- Invite: invite summary, reward summary, redeem preview placeholder
- Profile: saved items, inbox summary, benefit summary, device/auth snapshot
- Settings: runtime mode, auth state, device state, push capability/preview, dev-safe refresh/reset controls
