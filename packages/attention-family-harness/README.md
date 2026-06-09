# attention-family-harness

Step 03 freezes this package as the family-layer validation boundary.

## Public API

- `packageBoundary`
- `validationEntryNames`
- `reportShapeNames`
- `familyConsistencyRuleNames`
- `publicApi`

## Does Not Include

- source adapter smoke tests
- live infra checks
- migration execution

## Dependency Direction

- may depend on `attention-core-contracts`, `attention-family-contracts`, and `attention-family-runtime`
- no runtime package should depend on harness
