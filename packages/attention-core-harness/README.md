# attention-core-harness

Step 02 freezes this package as the shared validation and checkpoint boundary.

## Public API

- `packageBoundary`
- `validationEntryNames`
- `reportShapeNames`
- `checkpointConventionNames`
- `publicApi`

## Does Not Include

- domain smoke flows
- live service connectivity
- large build orchestration

## Dependency Direction

- may read package boundaries from contracts, runtime, mobile UI, and admin
- no other package should depend on harness
