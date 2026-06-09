# UI Design Diff

## Inputs Used

- `docs/UI_FREEZE_DECISIONS.md`
- `docs/UI_FREEZE_FINAL_MAP.md`
- `docs/STAGE_UI1_5_DECISIONS.md`
- `docs/READING_UI_BASELINE.md`
- `docs/design-handoff/stitch-ui1_5/DESIGN.md`
- `docs/design-handoff/stitch-ui1_5/screen.html`
- `docs/design-handoff/stitch-ui1_5/screen.png`
- flat Stitch screens under `docs/design-handoff/stitch-ui1_5/`
- current runtime structure from `mobile/pages.json`
- current page implementations under `mobile/pages/*`

## Top 5 Most Visible Differences

1. Bottom navigation count and information architecture differ.
   - Current code ships a 5-button tabBar.
   - Available Stitch exports visually suggest a much tighter bottom-nav shell, closer to a 3-entry content-first structure.
   - Freeze docs also emphasize re-homing old capabilities rather than expanding top-level entry points.

2. Current screens still read like foundation/debug-capable product shells, not a fully curated editorial UI.
   - `settings`, `profile`, `paywall`, and `inbox` still expose readiness/foundation information very directly.
   - The design system calls for a quieter, more content-first and more restrained presentation.

3. Visual language differs materially.
   - Current app uses many explicit cards, chips, section blocks, and visible utility surfaces.
   - The design system asks for cooler neutral surfaces, tonal layering, stronger whitespace rhythm, and fewer “tooling” cues.

4. Search/feed page composition differs.
   - Current feed is filter-chip heavy and foundation-summary heavy.
   - The Stitch exports emphasize lightweight discovery, calmer list composition, and a more curated visual hierarchy with simpler search-led entry.

5. Alias/internal capability routing is still implementation-visible.
   - `inbox`, `follows`, and `campaign` remain app routes.
   - Even when they redirect or act as internal capability pages, this is still structurally noisier than a fully design-synced IA.

## Structural Differences

- Current tabBar count is `5`; design direction appears materially slimmer.
- Current app pages still include three compatibility/internal routes in primary page registration.
- `inbox` is still a standalone internal capability page instead of being fully absorbed into home/profile-only user IA.
- `settings` is still treated as a route with extensive foundation/debug content; UI docs are not fully consistent on whether it should read as top-level or secondary.
- Current top-level route map remains implementation-oriented rather than strictly design-driven.

## Visual Differences

- Current color treatment is warmer and more card-heavy than the editorial, cooler, low-entropy system described in `DESIGN.md`.
- Current screens use many chips, meta rows, and utility blocks; the design reference suggests stronger typography-led hierarchy.
- Current shells expose dense explanatory descriptions at the top of many pages; design references trend toward cleaner, lighter copy.
- Current list/card spacing is functional; design references call for more breathing room and more deliberate asymmetry.
- Current nav/icon treatment does not yet match the Stitch export tone.

## Which Differences Should Be Fixed First

1. Runtime/source provenance.
   - Confirm HBuilderX is actually launching the current source project rather than `mobile/unpackage`.
2. IA contract cleanup.
   - Decide the intended bottom-nav count and first-level pages from a single authoritative source.
3. Route exposure cleanup prep.
   - Decide whether `inbox` remains an internal capability route or gets fully hidden from ordinary app routing flows.
4. Page hierarchy cleanup.
   - Reduce implementation/debug prominence on user-facing shells where freeze docs already define final responsibilities.
5. Visual token/application pass.
   - Only after the above structure is stable.

## What Must Wait For Confirmed Final Design Handoff

- Exact bottom-nav spec: item count, labels, icons, active/inactive behavior.
- Exact spacing, type scale, and component token mapping.
- Exact feed/search card composition and ordering.
- Exact settings/profile visual prominence rules.
- Final visual treatment for internal capability surfaces that still must exist for validation.

## Recommendation

- Do not do a broad UI polish pass yet.
- First lock runtime provenance and IA authority.
- Then work from the promoted handoff in `docs/design-handoff/stitch-ui1_5/`.
- Only after that should the app enter precise design-close finishing work.
