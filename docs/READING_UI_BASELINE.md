# Stage E2 Reading UI Baseline

## Goal

- Build a neutral, restrained, reading-first mobile baseline.
- Keep existing Stage E0/E1 read path contracts intact.
- Raise shells and placeholders to a coherent product-quality baseline without moving into F1 business implementation.

## Color Roles

- `bgCanvas`: app-level reading background.
- `surfaceBase` / `surfaceRaised`: primary cards and article containers.
- `surfaceMuted` / `surfaceTint`: quieter support surfaces and helper panels.
- `textPrimary` / `textSecondary` / `textMuted`: three-level content hierarchy.
- `accentPrimary` / `accentSoft`: CTA emphasis and active tabs.
- `successSurface`, `warningSurface`, `errorSurface`, `infoSurface`: unified state surfaces.

## Content Hierarchy

- Page title: one clear anchor per screen.
- Section header: break long screens into readable modules.
- Card title: used for feed cards, pricing cards, and setting groups.
- Meta: publication, mode, audience, timestamps, selection reason.
- Body: optimized for Chinese reading cadence, with higher line height and lower chroma.
- Caption: support copy, constraints, placeholder notes.

## Component Rules

- Card: rounded, soft border, low elevation, warm off-white surface.
- Chip: compact, information-only unless clearly acting as a tab.
- CTA: one primary action per card area; secondary actions stay quieter.
- State panel: never raw error dump styling; every state keeps the same structure and typography rhythm.

## Page Baseline

- Feed uses consistent cards, meta rows, chips, and one obvious read action.
- Detail prioritizes title, mode switch, article body, then supportive controls.
- Paywall emphasizes final displayed amount first, original amount second, and keeps canonical `fen -> UI` mapping.
- Settings, profile, invite, campaign share the same shells and section rhythm so they no longer read as debug pages.

## F1 Preparation

- Visual placeholders are reserved for inbox badge, notification list item, filter chip, follow chip, digest card, and update badge.
- These remain token- and guideline-level only in E2.
