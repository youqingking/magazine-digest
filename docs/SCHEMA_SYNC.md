# Stage D Schema Sync

## Canonical source

- `database/*.schema.json` is the only canonical source of truth.

## Mirrored target

- `mobile/uniCloud-aliyun/database/` is the generated mirror consumed by the actual uni-app project.

## Sync rule

- Run `powershell -ExecutionPolicy Bypass -File scripts/contracts/sync-unicloud-database.ps1` whenever `database/*.schema.json` changes.
- Stage D keeps the mirror one-way only: `database/ -> mobile/uniCloud-aliyun/database/`.

## Editing rule

- Manual edits are allowed only in `database/*.schema.json`.
- Manual edits in `mobile/uniCloud-aliyun/database/` are forbidden because the directory is regenerated.
- Do not maintain the same schema in both places by hand.
