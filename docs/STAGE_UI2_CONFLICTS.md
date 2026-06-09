# Stage UI2 Conflicts

## Conflict Register

### 1. Handoff bottom navigation vs frozen IA

- Handoff pages consistently show `首页 / 来源 / 我的`.
- Frozen IA remains the 7-page model already defined in UI freeze documents.
- Resolution:
  - Keep frozen IA.
  - Use Stitch bottom-nav visual tone only where useful.
  - Do not create a new official “来源” page.

### 2. “来源” page vs frozen search responsibility

- `screen-1.html` is a dedicated source-browsing page.
- Frozen IA says search owns search/filter/follow behavior.
- Resolution:
  - Absorb source exploration language into `search`.
  - Keep search as the only formal page for search/filter/follow.

### 3. Premium marketing copy vs confirmed business scope

- Handoff paywall includes broad premium promises and lifestyle marketing language.
- Product rules ban unconfirmed promises and fake business parameters.
- Resolution:
  - Keep confirmed Stage G preview surfaces only.
  - Rewrite copy to remain contract-safe and preview-only.

### 4. Profile simplification vs H0/H1a visibility

- Handoff profile is visually cleaner and less diagnostic.
- Current mainline must retain auth/device/runtime-related visibility in profile/settings surfaces.
- Resolution:
  - Move diagnostics out of the first visual plane where possible.
  - Do not remove required H0/H1a truth surfaces.

### 5. Detail aesthetic vs reading-chain freeze

- Handoff detail includes a strong summary card treatment.
- Frozen detail must remain one route with full vertical reading in both modes.
- Resolution:
  - Keep a calm mode switcher at top.
  - Keep complete body rendering in both modes.
  - Avoid progress bars, summary truncation, or cardified reading flow.

### 6. Home screenshot composition vs frozen discovery capability

- Handoff home is cleaner and visually narrower than current feature surface.
- Frozen home must still expose inbox entry, followed updates, continue reading, and saved/resume capability.
- Resolution:
  - Recompose home editorially.
  - Keep capability coverage through quieter sections rather than deleting them.

## Conflict Outcome

- UI2 adopts Stitch tone, spacing, card hierarchy, and calmer chrome.
- UI2 does not reopen IA, reading route, or foundation-surface decisions already frozen.
