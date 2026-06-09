# Stage DATA1B Registry Model

## Publication Registry

文件：`data/real-content/publications.json`

最小字段：

- `id`
- `display_name`
- `locale`
- `status`
- `parser_profiles`

## Issue Registry

文件：`data/real-content/issues.json`

最小字段：

- `issue_id`
- `publication_id`
- `issue_label`
- `source_zip`
- `manifest_path`
- `article_count`
- `parser_profile`
- `import_warnings_count`
- `status`

## Runtime Scenario Registry

文件：`mobile/fixtures/runtime/scenarios/index.json`

最小字段：

- `scenario_id`
- `scenario_type`
- `bundle_path`
- `included_publications`
- `included_issues`
- `paywall_test_rule`
- `parser_profiles`
- `build_label`
- `enabled_at`
- `status`
- `is_selected_for_current`

## Selected Pointer

文件：`mobile/fixtures/runtime/scenarios/selected.json`

作用：

- 记录当前发布到 `current` 的 scenario id
- 提供 provenance
- 避免 `current` 成为不可追踪的覆盖态
