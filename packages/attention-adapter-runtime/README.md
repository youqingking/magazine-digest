# attention-adapter-runtime

Step 04 freezes this package as the adapter route and pilot mapping boundary above shared core and alongside the optional family layer.

JS-first note:

- this skeleton uses `src/index.js`
- a later TypeScript migration must preserve the same public surface names

## Public API

- `packageBoundary`
- `routeContractNames`
- `adapterRouteTypes`
- `adapterRegistryShapeName`
- `adapterRegistryFieldNames`
- `mappingDiagnosticsShapeName`
- `mappingDiagnosticsFieldNames`
- `pilotAdapterNames`
- `pilotAdapterRegistry`
- `listAdapterRegistryEntries`
- `findAdapterRegistryEntry`
- `publicApi`

The registry public API boundary is metadata-only:

- route contract names
- registry shape names
- diagnostics shape names
- pilot registry entries
- pilot stub exports

## Does Not Include

- real source fetching
- ingestion pipelines
- domain workflow ownership
- shared core rewrites
- family layer rewrites

## Dependency Direction

- may depend on `attention-core-contracts` and `attention-family-contracts`
- may be consumed by `attention-adapter-harness` and future source adapters
