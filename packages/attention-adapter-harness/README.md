# attention-adapter-harness

Step 04 freezes this package as the adapter-layer validator and report-shape boundary.

JS-first note:

- this skeleton uses `src/index.js`
- a later TypeScript migration must preserve the same public surface names

## Public API

- `packageBoundary`
- `validationEntryNames`
- `reportShapeNames`
- `adapterConsistencyRuleNames`
- `adapterReportShapeName`
- `adapterReportFieldNames`
- `createAdapterReport`
- `publicApi`

This package is responsible for:

- Step 04 validator entry names
- adapter validation report shape names
- route coverage and consistency rule names

## Does Not Include

- real smoke pipelines
- real source verification
- source fetching
- domain migration execution

## Dependency Direction

- may depend on `attention-core-contracts`, `attention-family-contracts`, and `attention-adapter-runtime`
- should not be depended on by runtime packages
