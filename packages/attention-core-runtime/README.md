# attention-core-runtime

Step 02 freezes this package as the shared runtime seam boundary.

## Public API

- `packageBoundary`
- `adapterInterfaceNames`
- `runtimeModeNames`
- `serviceSeamNames`
- `registryShapeNames`
- `publicApi`

## Does Not Include

- magazine mapping implementations
- YouTube mapping implementations
- remote transport credentials
- page-level UI behavior

## Dependency Direction

- may depend on `attention-core-contracts`
- must not depend on mobile UI, admin, or harness
