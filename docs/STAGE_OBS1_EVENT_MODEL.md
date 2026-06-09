# Stage OBS1 Event Model

## Schema Version

- `schema_version`: `stage-obs1-v1`

## Required Base Fields

- `event_id`
- `event_type`
- `event_category`
- `occurred_at`
- `severity`
- `source_surface`
- `session_id`
- `run_id`
- `user_mode`
- `app_env`
- `product_key`

## Release-aware Runtime Context

- `runtime_source_mode`
- `runtime_source_id`
- `scenario_id`
- `release_id`
- `channel`
- `baseline_scenario_id`
- `selected_scenario_id`
- `current_mirror_scenario_id`

规则：

- source 相关事件必须至少带上 `runtime_source_mode`。
- channel / release 事件必须同时带 `channel` 与 `release_id`。
- scenario 解析与 bundle 读取事件必须带 `scenario_id`。
- publish / rollback / promote 事件必须带 `baseline_scenario_id`、`selected_scenario_id`、`current_mirror_scenario_id`。

## Optional Content Context

- `publication_id`
- `issue_id`
- `article_id`
- `canonical_section_key`
- `discovery_bucket`

规则：

- feed / search / publication list 事件尽量带 publication / section 维度。
- detail / payload / content failure 事件优先带 `article_id`，若可定位 issue/publication 也一并带上。

## Error and Diagnostic Fields

- `error_code`
- `error_message`
- `warning_taxonomy`
- `accepted_warning`
- `details`

规则：

- 所有 `error` / `critical` 事件必须带 `error_code`。
- 预算或 taxonomy 相关事件必须带 `warning_taxonomy`。
- accepted warning 相关事件必须显式标 `accepted_warning=true`。
- `details` 保持 machine-readable object，不塞长篇文本。

## Category Model

- `runtime_source`
- `content_discovery`
- `content_detail`
- `quality`
- `ops_release`
- `incident`

## Severity Model

- `info`
  - 成功动作、状态快照、预期切换
- `warning`
  - 可恢复异常、accepted warning、需要 operator 关注但不阻塞 runtime
- `error`
  - 关键页面失败、source/channel/scenario 解析失败、publish/rollback/read path 异常
- `critical`
  - baseline/provenance 断裂、release blocking、无法恢复的 current/channel head 关键错误

## Sink Contract

每个事件落盘为独立 json 文件，至少包含：

- `schema_version`
- `event`
- `ingested_at`
- `sink_version`

summary sink 只消费 schema，不扩展另一套字段命名。
