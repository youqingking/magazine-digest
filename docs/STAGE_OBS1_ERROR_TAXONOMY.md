# Stage OBS1 Error Taxonomy

## Severity Policy

### `info`

- 成功加载
- runtime source 正常解析
- promotion evaluation 正常完成
- accepted warning 在预算内

### `warning`

- 可恢复失败后回退到缓存
- taxonomy gap 被发现但未越预算
- preview-only accepted warning
- override drift 需要 operator 关注

### `error`

- source / channel / scenario 解析失败
- feed / search / detail 主路径失败
- publish / rollback 动作失败
- release / channel manifest 无效
- article payload 缺字段导致不可读

### `critical`

- baseline/current provenance 断裂
- current mirror 与 selected/runtime source 无法解释
- release blocking 且影响当前 channel head
- rollback 后无法恢复 baseline

## Actionability Classes

### Recoverable

- `content_load_failed`
- `article_payload_incomplete`
- `runtime_source_invalid`
- `unmapped_taxonomy_encountered`

### Operator Attention Required

- `warning_budget_exceeded`
- `taxonomy_gap_detected`
- `channel_publish_rejected`
- `publish_failed`
- `rollback_failed`

### Release Blocking

- `release_manifest_invalid`
- `channel_manifest_invalid`
- `scenario_resolution_failed`
- `runtime_source_invalid` when current target is missing
- `rollback_failed`

### Dev-only Noise

- accepted best-effort warnings within budget
- preview-only anomalies already registered
- filter / search / source load informational events

## Initial Error Codes

- `OBS1_RUNTIME_SOURCE_INVALID`
- `OBS1_SCENARIO_MISSING`
- `OBS1_SCENARIO_BUNDLE_MISSING`
- `OBS1_CHANNEL_MANIFEST_INVALID`
- `OBS1_RELEASE_MANIFEST_INVALID`
- `OBS1_CONTENT_LOAD_FAILED`
- `OBS1_ARTICLE_PAYLOAD_INCOMPLETE`
- `OBS1_WARNING_BUDGET_EXCEEDED`
- `OBS1_PUBLISH_FAILED`
- `OBS1_ROLLBACK_FAILED`
