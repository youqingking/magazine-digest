# Pilot Registry Integration

## Purpose

Step 05 freezes how the Step 04 pilot adapters are integrated into a Wave 2 registry flow without changing Step 02 shared core, Step 03 family layer, or Step 04 adapter layer.

References:

- `docs/SHARED_PACKAGE_APIS.md`
- `docs/SOURCE_FAMILY_LAYER.md`
- `docs/ADAPTER_REGISTRY.md`
- `docs/ROUTE_RESOLUTION_FLOW.md`
- `docs/DOMAIN_PILOT_SELECTION.md`

## Frozen Integration Responsibilities

### Shared Core

Shared core does not directly know source-specific raw shapes.

Shared core only receives:

- shared-facing projection names
- runtime surface metadata
- route resolution outputs

Shared core must not depend on:

- adapter raw input schemas
- family normalizer internals
- domain-specific pilot files

### Family Runtime

Family runtime only consumes adapter-provided raw shapes and emits family-normalized shapes.

Family runtime must not:

- directly consume product-domain business objects beyond adapter-provided raw shape
- directly emit shared core projection as its primary output
- bypass adapter route declaration

### Adapter Runtime

Adapter runtime owns:

- route declaration
- registry entry building
- pilot index integration
- mapping diagnostics linkage

Adapter runtime does not own:

- shared core contracts
- family core contracts
- real source execution

### Core Runtime

Core runtime owns:

- consuming adapter registry entries
- resolving direct path versus family path
- producing shared-facing runtime surface maps
- emitting route-resolution diagnostics for validation

Core runtime does not own:

- source-specific mapping logic
- family normalizer implementation detail
- product-domain business behavior

## Frozen Integration Flow

1. adapter runtime exposes pilot definitions and registry entries
2. core runtime consumes registry entries as metadata input
3. route resolver selects either direct or family path
4. if family path is selected, family runtime normalizer contract is named as the intermediate shape boundary
5. core runtime emits shared-facing surface metadata
6. domain skeleton consumes the integrated registry entry, not the raw pilot shortcut

## Guardrails

- shared core must not reverse-depend on adapter details
- family runtime must not directly eat domain raw objects outside adapter-declared raw shapes
- domain skeleton must not bypass adapter registry
- `podcast-domain` must connect through `transcript_first_longform` family path before shared projection
- `magazine-domain` and `youtube-domain` remain direct-path domains in Step 05
