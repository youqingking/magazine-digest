# Shared Runtime Adoption Rules

## Purpose

Step 06 freezes how domain adoption code is allowed to consume the shared runtime, family runtime, and adapter runtime.

References:

- `docs/SHARED_PACKAGE_APIS.md`
- `docs/SELECTED_DOMAIN_ADOPTION.md`
- `docs/ROUTE_RESOLUTION_FLOW.md`

## Allowed Adoption Path

Domain adoption code may only adopt through:

1. `attention-adapter-runtime`
2. `attention-family-runtime` when family path applies
3. `attention-core-runtime`

## Import Rule

Domain adoption code must not deep import arbitrary shared internals to bypass the runtime surfaces.

If monorepo package consumption is not fully wired, repo-relative imports are allowed only to explicit package entry files such as:

- `packages/attention-adapter-runtime/src/execute-pilot-mapping.js`
- `packages/attention-adapter-runtime/src/build-pilot-diagnostics.js`
- `packages/attention-family-runtime/src/run-family-normalizer.js`
- `packages/attention-core-runtime/src/run-route-resolution.js`
- `packages/attention-core-runtime/src/project-to-shared-envelope.js`
- `packages/attention-core-runtime/src/adopt-pilot-entry.js`

Direct imports to unrelated internal files are not part of Step 06 adoption rules.

## Domain Adoption Guardrails

- domain adoption must go through adapter runtime first
- family-backed adoption must go through family runtime when route type is `family`
- shared projection must be produced through core runtime helpers
- diagnostics must stay runtime-facing and validation-facing

## Out Of Scope

Step 06 does not require:

- bundle optimization
- workspace dependency cleanup
- package publishing changes
- real runtime transport setup

Step 06 only requires that the adoption path is clear, bounded, and executable.
