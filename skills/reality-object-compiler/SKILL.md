---
name: reality-object-compiler
description: Compile evidence-backed reality objects from repo facts so future agents can distinguish observed state, decisions, assumptions, and blockers.
---

# Reality Object Compiler

## Use When

Use this skill when agent output needs to separate current reality from plans,
assumptions, desired architecture, and missing human inputs.

## Object Shape

Use this structure:

```yaml
id: short-stable-id
kind: observed_state | decision | boundary | blocker | assumption
summary: one sentence
evidence:
  - path or command
confidence: high | medium | low
product_key_scope: required | present | missing | not_applicable
next_action: concrete next step or none
```

## Rules

- Every object needs evidence.
- Mark uncertain items as assumptions, not facts.
- Mark missing accounts, credentials, service spaces, desktop tools, or product
  ownership decisions as blockers.
- Preserve the repo boundary: external content production stays outside the app
  repository.
- Preserve legacy DCloud / uni-app / uniCloud paths as migration references
  unless a separate cleanup thread changes that boundary.

## Output

Return a concise list of reality objects and any remaining `NEED_HUMAN` items.
