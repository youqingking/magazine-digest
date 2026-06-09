# Stage E2 Decisions

## Freeze Respect

- Stage B money, discount, timezone, and reward semantics remain unchanged.
- Stage E0/E1 runtime gateway, cache, and page flow stay intact.
- Backend/admin logic is not rewritten for E2.

## UI Strategy

- Tokens live in `mobile/theme/*` and stay intentionally lightweight.
- Reusable UI primitives handle cards, chips, buttons, tabs, state panels, meta rows, and pricing cards.
- Reader components own title, body, tags, unavailable notice, and reading-progress helper presentation.

## State Strategy

- `StatePanel` is the shared baseline for loading, empty, error, unavailable, cached, and placeholder states.
- Cached fallback is explicitly documented as a positive resilience branch.

## F1 Reserved Visual Primitives

- Notification list item
- Inbox badge
- Filter chip
- Follow chip
- Digest card
- Update badge

These are reserved in tokens and guidelines only. Stage F1 business implementation has not started in this stage.
