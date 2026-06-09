# Stage DATA3 Normalization Policy

## Mapping Rules

- canonical taxonomy 是轻量 discovery 层，不替代 publication 自身栏目体系。
- `section_label` 保持 raw；canonical 字段只做新增，不做覆盖。
- unmapped label 必须带 `taxonomy_warnings`，并进入 coverage report。

## Mapping Hierarchy

1. publication-specific explicit map
2. canonical section default bucket
3. unmapped fallback with warning

## UI Consumption Rules

- feed 优先展示 canonical section label 或 discovery bucket，publication 身份仍优先保留。
- search 支持 publication + canonical section / bucket 组合筛选。
- detail 可同时显示 canonical 与 raw section，但保持低强调。

## Promotion Rules

- taxonomy coverage 默认进入 `info` 或 `warning`，不是新的高强度 blocker。
- 只有 unmapped 或 fallback 导致内容消费错误时，才应上升为更高风险。
- `data2_multi_publication_release_candidate` 维持 release candidate 身份，不因为 taxonomy 改造改变 lifecycle 语义。
