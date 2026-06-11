---
name: owner-card
description: Create compact ownership cards for repository areas, decisions, blockers, and follow-up threads without changing implementation code.
---

# Owner Card

## Use When

Use this skill when a repo area, decision, seam, or migration thread needs a
small ownership summary before implementation begins.

## Card Shape

Each owner card should include:

- `area`: repository area or seam.
- `owner_role`: accountable agent or human role.
- `status`: proposed, active, blocked, deferred, or retired.
- `product_key_support`: required, present, missing, or not applicable.
- `allowed_paths`: paths the owner may touch for the current thread.
- `blocked_by`: concrete missing input, credential, tool, or decision.
- `evidence`: files or commands that support the card.

## Rules

- Keep cards factual and compact.
- Do not assign real people without explicit project evidence.
- Do not encode prices, entitlements, thresholds, feature flags, experiments,
  or risk controls as constants.
- If ownership depends on accounts, credentials, service spaces, or desktop
  tools, write a `NEED_HUMAN` item instead of guessing.

## Output

Return Markdown that can be pasted into `docs/agents/` or a future scoped
harness document.
