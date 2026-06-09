# Stage DATA1C Audience Matrix

## Shared Policy

- policy key: `adult_to_general_compat_v1`
- `general_quick_30s <- adult quick_30s`
- `general_deep_3m <- adult deep_3m`

## Barron's

- adult source: `Barron’s-09022026-release/adult/*.md`
- youth source: `Barron’s-09022026-release/youth/*.md`
- general: derived from adult

## The Atlantic

- adult source: `The Atlantic-012026-release/adult/*.md`
- youth source: `The Atlantic-012026-release/youth/*.md`
- general: derived from adult

## The Economist

- adult source: `TheEconomist20260314-release/adult/*.md`
- youth source: `TheEconomist20260314-release/youth/*.md`
- general: derived from adult

## Partial Import Rule

- 若只解析到 adult 或只解析到 youth，保留可得侧并记录 `import_warnings`
- 本次 `Three-release.zip` 审计中未发现缺边 pair
