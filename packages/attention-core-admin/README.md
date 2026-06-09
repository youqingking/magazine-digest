# attention-core-admin

Step 02 freezes this package as the shared admin registry boundary.

## Public API

- `packageBoundary`
- `generatedRailNames`
- `manualRailNames`
- `registryNames`
- `publicApi`

## Does Not Include

- magazine issue ops
- taxonomy override workflows
- channel or video domain workflows

## Dependency Direction

- may depend on `attention-core-contracts`
- must not own source-specific workflow logic
