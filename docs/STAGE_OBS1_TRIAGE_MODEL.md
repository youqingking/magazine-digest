# Stage OBS1 Triage Model

## Primary Views

- `runtime-events-report.json`
  - recent events 的统一入口
- `incident-summary.json`
  - recent error / critical / unresolved warning 的事故摘要
- `source-health-report.json`
  - runtime source / scenario / release provenance 健康度
- `channel-health-report.json`
  - dev / staging / production channel 头指针与最近 publish/rollback 健康度
- `content-health-report.json`
  - content load、payload incomplete、taxonomy gap 等内容健康视图
- `triage-dashboard.json`
  - operator 首屏读取的汇总视图

## Triage Questions

### 1. Current Source Provenance

必须回答：

- 当前 app / runtime 读的是 `current_mirror`、`scenario_preview` 还是 `channel_head`
- 对应的 `scenario_id` / `channel` / `release_id`
- 当前 `selected/current/baseline` 是否一致或可解释

### 2. Recent Runtime Failures

必须回答：

- 最近是否发生 `runtime_source_invalid`
- 最近是否发生 `scenario_bundle_missing`
- 最近是否发生 `channel_manifest_invalid` / `release_manifest_invalid`

### 3. Content Failure Hotspots

必须回答：

- 最近 `content_load_failed` 最多的是哪些 publication / issue / article
- 是否存在 `article_payload_incomplete`
- `detail` 是否出现 audience / reading mode 切换后的不可恢复失败

### 4. Release Regression Hints

必须回答：

- 最近一次 `channel_publish_succeeded` 或 `channel_rollback_succeeded` 后，是否马上出现内容读取失败
- 哪个 channel 最近 failure rate 最高
- 是否有 publish succeeded 但 source health 下降

### 5. Quality Drift

必须回答：

- `taxonomy_gap_detected` 是否增长
- `warning_budget_exceeded` 是否出现
- `accepted_warning_applied` 是否仍在预算内

## Incident Formation

以下事件直接进入 incident summary：

- severity `error`
- severity `critical`
- `warning_budget_exceeded`
- `scenario_resolution_failed`
- `content_load_failed`
- `publish_failed`
- `rollback_failed`

incident summary 需包含：

- counts by severity
- counts by event type
- last seen timestamp
- top affected publications / issues / articles
- most recent publish / rollback correlation
