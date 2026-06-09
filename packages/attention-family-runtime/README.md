# attention-family-runtime

Step 03 freezes this package as the family runtime seam boundary.

## Public API

- `packageBoundary`
- `familyRegistryNames`
- `familyProjectionNames`
- `familySeamNames`
- `adapterBridgeNames`
- `publicApi`

## Does Not Include

- source adapter implementations
- shared core implementation rewrites
- real remote connectivity

## Dependency Direction

- may depend on `attention-core-contracts` and `attention-family-contracts`
- may be consumed by future source adapters and family harness
