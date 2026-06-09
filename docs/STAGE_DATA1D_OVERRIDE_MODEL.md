# Stage DATA1D Override Model

## Storage

- 目录：`data/real-content/overrides/<publication>/<issue>/metadata-overrides.json`

## Intent

- override 层后置于 parser 结果，用于最小 metadata 纠偏。
- override 不替代 parser，不做整期重写。

## Allowed Fields

- `title`
- `section_label`
- `ordinal`
- `author`
- `canonical_url`
- `display_warning_suppression`

## Auditability

每条 override 必须可追踪：

- `article_id`
- `reason`
- 覆盖字段的 `before / after`
- 被 suppression 的 warning 列表

## Content Safety Boundary

- 默认不允许覆盖 `quick_30s / deep_3m / teen_quick_30s / teen_deep_3m`。
- 若未来必须修正文内容块，只能逐条记录理由，且应视为例外。
