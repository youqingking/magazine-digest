# Stage UI2 Decisions

## Scope Freeze

- Stage UI2 is a design handoff merge on current mainline.
- No schema change.
- No backend contract change.
- No payment semantic change.
- No real payment provider, webhook, or entitlement activation.

## Governing Priority

1. Stage B canonical contracts
2. H0 / H1a auth, device, push, and payment-readiness visibility
3. Frozen 7-page IA and unique detail route
4. Stage G commercial and growth read-model capability
5. Stitch visual treatment

## Official Page Freeze

- `pages/feed/index`
- `pages/detail/index`
- `pages/search/index`
- `pages/paywall/index`
- `pages/invite/index`
- `pages/profile/index`
- `pages/settings/index`

## Alias Freeze

- `pages/inbox/index` remains internal capability / compatibility route
- `pages/follows/index` remains compatibility route
- `pages/campaign/index` remains compatibility route
- None of the above return as formal IA entries

## Design Intake Decision

- The active design handoff is the extracted, source-controlled files under `docs/design-handoff/stitch-ui1_5/`.
- Stage UI2 no longer depends on `stitch_app(7).zip` or `stitch_app(5).zip`; the extracted HTML / PNG / `DESIGN.md` files are the official local handoff.
- `screen.html` / `screen.png` are treated as the latest homepage handoff.
- `screen-1.html` to `screen-5.html` are treated as secondary page references and component-language references.
- `DESIGN.md` defines the editorial visual language and overrules incidental screenshot chrome when it conflicts with frozen IA.

## Merge Decisions

- Home adopts Stitch editorial shell and calmer discovery composition, but keeps current discovery foundation and return-state semantics.
- Detail remains the only article page and keeps `quick_30s` / `deep_3m` on one route.
- Search absorbs the “来源” visual language rather than introducing a new official “来源页”.
- Paywall keeps Stage G offer/quota/promo/campaign surfaces while adopting Stitch premium visual language.
- Invite derives its visual language from the paywall/profile system because there is no direct invite handoff page.
- Profile adopts the “我的” handoff structure while keeping saved/inbox/benefit/device summary responsibilities.
- Settings derives from the same account-surface visual language, but runtime/auth/device/push readiness stays visible.

## Non-Adopted Screenshot Details

- 3-item bottom navigation is not adopted as a literal IA change in this stage.
- Any “来源” global nav item is treated as visual inspiration for search/filter entry, not as a new official page.
- Subscription marketing copy that implies unconfirmed business promises is not adopted verbatim.
- Task/progress/challenge framing remains disallowed even if present in any decorative draft detail.
