# Screenshot Storyboard

## Status

This storyboard is a Play Store screenshot planning `draft`. It is not a public screenshot asset set, not a Google Play submission decision, and not evidence that screenshots may be used in Play Console.

All real capture, device specs, cropping, visual review, trademark review, content authorization, Google Play image spec review, and public store asset selection remain `human review required`.

Only current Expo runtime shell surfaces may be shown:

- `/`
- `/article/[articleId]`
- `/debug`

The app must not show unavailable features such as live Supabase sync, RevenueCat purchase or paywall, Push permission, account sign-in, cloud sync, or a production content pipeline.

## Evidence Source

- App shell: `apps/mobile`
- Route source: `apps/mobile/app/index.tsx`, `apps/mobile/app/article/[articleId].tsx`, `apps/mobile/app/debug.tsx`
- Runtime boundary: `docs/mobile/MOBILE_RUNTIME_SHELL.md`
- Preferred controlled fixture for capture planning: `s01_normal_full_matrix`
- Preferred article id for article shots: `art_s01_city_signals`

evidence_refs:

- `evidence.ss.route_index`
- `evidence.ss.route_article`
- `evidence.ss.route_debug`
- `evidence.ss.fixture_scenario`

## Public Candidate Shots

### Shot 1: Discovery List

- Route: `/`
- Fixture/scenario: `s01_normal_full_matrix` preferred; `current` may be reviewed separately if the content is readable and authorized.
- Capture path: `/`
- Purpose: Show the fixture-backed discovery list and the runtime shell's `product_key` / scenario metadata.
- Visible evidence: `product_key`, scenario id, article card, publication label, article summary, `Scenario debug` navigation button.
- Must not show: live sync, subscription CTA, RevenueCat purchase, Push permission, account login, cloud account, production content pipeline.
- Review: `human review required`

### Shot 2: Article Reading

- Route: `/article/[articleId]`
- Fixture/scenario: `s01_normal_full_matrix`
- Capture path: `/article/art_s01_city_signals`
- Purpose: Show a fixture-backed article detail / reading view that exists in the current Expo Router shell.
- Visible evidence: article title, publication or publication key, `product_key`, scenario id, reading mode, fixture `markdown_body`.
- Must not show: unavailable article state, paywall, purchase flow, account sign-in, cloud sync, production content claim.
- Review: `human review required`

### Shot 3: Reading Detail Continuation

- Route: `/article/[articleId]`
- Fixture/scenario: `s01_normal_full_matrix`
- Capture path: `/article/art_s01_city_signals`, scrolled lower if enough body text renders.
- Purpose: Show continued reading from the same fixture-backed article without adding a new feature claim.
- Visible evidence: body paragraphs from the selected fixture, same article context as Shot 2.
- Must not show: generated marketing overlay, production content claim, third-party trademark claim, subscription entitlement.
- Review: `human review required`

## Internal Evidence Shot

### Shot 4: Scenario Debug / Seam Status

- Route: `/debug`
- Fixture/scenario: `s01_normal_full_matrix` preferred; `current` may be used for internal evidence.
- Capture path: `/debug`
- Purpose: Internal evidence that Supabase, RevenueCat, and Push-related seams remain placeholders or reserved seams rather than live integrations.
- Visible evidence: selected scenario, `product_key`, Supabase runtime data seam, RevenueCat entitlement seam, Product notification seam, runtime source.
- Public use: internal evidence only by default; public screenshot use requires explicit `NEED_HUMAN` approval.
- Must not show: any claim that reserved seams are live, any Play Console submission claim, any public asset approval claim.
- Review: `human review required`

## Capture Rules

- Real screenshots must come from the current app; do not use mock screens to show unavailable features.
- Do not modify app source behavior to make a screenshot look better.
- Do not create or commit screenshot image files in this agent run.
- Do not present `/debug` as a public store screenshot unless a human reviewer explicitly approves that use.
- If a device, emulator, browser, or capture command is unavailable, classify it as `tool_missing` or `environment_blocked`.
- This MVP produces storyboard, shot-list, and validation notes only.

## M2 Harness Claims

| claim_id | claim_class | status | value | evidence_refs | human gate |
| --- | --- | --- | --- | --- | --- |
| `ss.c0.routes_observed` | `C0` | `observed_in_repo` | Current app routes are `/`, `/article/[articleId]`, and `/debug` | `evidence.ss.route_index`, `evidence.ss.route_article`, `evidence.ss.route_debug` | no |
| `ss.c0.shot_list_maps_existing_routes` | `C0` | `observed_in_repo` | Planned shots map only to existing routes and fixture scenarios | `evidence.ss.shot_list`, `evidence.ss.fixture_scenario` | no |
| `ss.c2.store_visual_messaging_needs_review` | `C2` | `needs_human` | Screenshot message and user benefit copy needs owner/Pro review | `evidence.ss.storyboard` | yes |
| `ss.c4.play_screenshot_use_needs_review` | `C4` | `needs_human` | Public Play Store screenshot use requires image spec, rights, and store review | `evidence.ss.human_review` | yes |

## Human Approval Points

- Real device or emulator capture plan.
- Google Play screenshot size, aspect ratio, and cropping review.
- Trademark and content authorization.
- Public store asset selection.
- Human approval before using any screenshot in Play Console.

## Validator

```powershell
python scripts/agent_tools/validate_screenshot_storyboard.py .
```
