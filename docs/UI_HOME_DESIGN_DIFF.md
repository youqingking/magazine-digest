# UI Home Design Diff

## Scope

- Compare current `mobile/pages/feed/index.vue` against the latest homepage handoff:
  - `docs/design-handoff/stitch-ui1_5/screen.html`
  - `docs/design-handoff/stitch-ui1_5/screen.png`
- Focus on structure, visual hierarchy, and implementation-prep priorities.
- No schema/backend/payment scope is included.

## Current Home Reality

- Current home is a stateful discovery shell with:
  - top page title and explanatory description
  - inbox badge plus runtime meta strip
  - three separate chip/filter rows
  - optional hero card
  - optional inbox summary card
  - multiple `DiscoverySection` blocks driven by store modules
- Current page strongly exposes runtime/filter state and foundation capability.

## Latest Home Handoff Reality

- Latest handoff home is a curated reading-first list page with:
  - minimal top app bar
  - dual-layer sticky navigation
    - source chips
    - category tabs
  - dense but calm article list
  - floating primary action button
  - 3-item bottom nav
- The page reads as an editorial product surface, not as a runtime/debug-aware capability shell.

## Most Obvious Differences

1. Top structure is different.
   - Current page starts with `SectionHeader` plus descriptive copy.
   - Latest handoff starts with a compact app bar and no explanatory product paragraph.

2. Navigation model is different.
   - Current page uses three stacked chip rows for tab/publication/update filtering.
   - Latest handoff uses two sticky navigation layers: source selection and category selection.

3. Content composition is different.
   - Current page leads with a hero card and section modules.
   - Latest handoff leads with a uniform article stream/grid.

4. Foundation visibility is too prominent in current code.
   - Inbox badge, runtime meta, and explicit “capability归位” descriptions are visible in the main reading surface.
   - Latest handoff suppresses these implementation cues.

5. Bottom navigation differs materially.
   - Current app runtime still ships a 5-button tabBar in `pages.json`.
   - Latest home handoff shows a 3-item bottom nav: `首页 / 来源 / 我的`.

## Structural Differences

### A. App bar and entry chrome

- Current:
  - large page header copy
  - no compact native-like app bar shell
- Handoff:
  - compact top bar with menu and search affordances
  - sticky sub-header beneath it

### B. Filter architecture

- Current:
  - `精选 / 已关注 / 消息 / 已保存`
  - publication filter row
  - update-type filter row
- Handoff:
  - source row: `全部来源 / 财新 / 晚点 / 极客公园 / 少数派 / InfoQ / 更多来源`
  - category row: `今日焦点 / 商业财经 / 科技前沿 / 产品思维 / 开发者视角 / 人文社科`
- Conclusion:
  - Current filtering model is implementation-oriented.
  - Handoff filtering model is user-mental-model oriented.

### C. Feed body

- Current:
  - hero-first
  - section-based content blocks
  - inbox card appears conditionally as a dedicated block
- Handoff:
  - continuous article cards
  - homogeneous reading rhythm
  - no dedicated inbox block in the main stream

### D. IA implication

- Handoff homepage assumes `来源` becomes a first-level destination in bottom navigation.
- Current code instead treats source/publication choice as an in-page filter, while bottom nav still contains `搜索 / 订阅 / 邀请 / 我的`.
- This is the single biggest IA conflict between current runtime and the latest homepage handoff.

## Visual Differences

### A. Tone

- Current UI is functional and explanatory.
- Handoff UI is restrained, editorial, and much less verbose.

### B. Card rhythm

- Current sections create chunky blocks with visible conceptual grouping.
- Handoff creates a consistent card cadence with lighter framing.

### C. Typography

- Current headings/descriptions are explicit and instructional.
- Handoff emphasizes concise publication label, article title, and summary hierarchy.

### D. Surface treatment

- Current page uses reusable app shell components that still feel like a platform scaffold.
- Handoff uses cool neutral layers, sticky glass surfaces, and calmer contrast distribution.

## What Should Be Fixed First

1. Lock homepage IA authority.
   - Decide whether the app is actually moving to `首页 / 来源 / 我的` bottom nav.
   - Without that decision, homepage implementation can only partially align.

2. Remove explanatory header treatment from home.
   - Replace the large `SectionHeader` intro with compact app-bar-level chrome.

3. Replace current 3-row filter stack with the handoff's 2-layer sticky nav model.
   - source layer
   - category layer

4. De-emphasize runtime/foundation cues on the main home surface.
   - inbox badge, runtime meta, and implementation wording should move off the primary reading plane.

5. Change content layout from hero-plus-sections to editorial list/grid.
   - keep data sources and contracts
   - change only presentation and page composition

## What Should Not Be Touched Yet

- Backend/store contracts feeding discovery data
- alias route semantics
- payment/commercial foundations
- schema/backend surfaces

## Ready For Implementation?

- Ready for presentation-layer restructuring of `feed`: `Yes`
- Ready for final homepage IA freeze including bottom nav change: `Only if user confirms latest homepage handoff overrides current 5-tab IA`

## Recommended Next Step

- Treat `docs/design-handoff/stitch-ui1_5/screen.html` as the homepage visual source of truth.
- Do a homepage-only restructuring pass first.
- Defer global tabBar/page-IA rewrite until the user explicitly confirms the homepage handoff is also the final navigation authority.
