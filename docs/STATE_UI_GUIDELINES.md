# Stage E2 State UI Guidelines

## Unified States

- `loading`: progress without panic language.
- `empty`: no matching content, with optional next-step hint.
- `error`: system or adapter failure.
- `unavailable`: business-safe no-content state.
- `cached`: positive fallback state using previously stored data.
- `premium locked / paywall preview`: readable teaser plus clear subscription framing.
- `placeholder`: low-priority shell for future surfaces.

## Rules

- Prefer `StatePanel` across pages instead of bespoke state blocks.
- `error` and `unavailable` must never share the same copy:
  - `error` means fetch/runtime problem.
  - `unavailable` means rules intentionally returned no safe readable content.
- `cached` must read as resilience, not failure.
- Locked/paywall preview should feel trustworthy and product-like, not like an alert banner.

## Copy Tone

- Short, direct, reading-context language.
- Include machine reason when useful, but always wrap it in human framing.
- Avoid debug phrasing as the primary visible message.
