# attention-family-contracts

Step 03 freezes this package as the source-family contract boundary above shared core and below source adapters.

JS-first note:

- this skeleton uses `src/index.js`
- a later TypeScript migration must preserve the same public surface names

## Public API

- `packageBoundary`
- `familyNames`
- `layeringRuleNames`
- `familyModelNames`
- `familyEnumNames`
- `familyKeyNames`
- `promotionRuleNames`
- `compatibilityGuardrails`
- `publicApi`

## Does Not Include

- source adapter implementations
- shared core rewrites
- business-page logic

## Dependency Direction

- may depend on `attention-core-contracts`
- may be consumed by `attention-family-runtime`, `attention-family-harness`, and future source adapters
