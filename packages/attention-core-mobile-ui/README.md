# attention-core-mobile-ui

Step 02 freezes this package as the shared mobile presentation boundary.

## Public API

- `packageBoundary`
- `primitiveNames`
- `presentationContractNames`
- `statePanelTypes`
- `themeSurfaceNames`
- `publicApi`

## Does Not Include

- business pages
- domain-specific page composition
- source-specific render logic

## Dependency Direction

- may depend on `attention-core-contracts`
- must not depend on runtime implementations
