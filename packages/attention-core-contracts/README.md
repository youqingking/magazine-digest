# attention-core-contracts

Step 02 freezes this package as the shared contract boundary.

JS-first note:

- this skeleton uses `src/index.js` because the current repo is JS-heavy
- a later TypeScript migration must preserve the same public surface names

## Public API

- `packageBoundary`
- `canonicalModelNames`
- `enumNames`
- `keyAliasMap`
- `payloadShapeNames`
- `schemaContractNames`
- `publicApi`

## Does Not Include

- domain mapping logic
- runtime service implementations
- page composition
- admin workflows

## Dependency Direction

- depends on no other shared package
- may be consumed by runtime, mobile UI, admin, and harness packages
