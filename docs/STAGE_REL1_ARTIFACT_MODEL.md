# Stage REL1 Artifact Model

## Immutable Fields

- `release_id`
- `source_scenario_id`
- `baseline_scenario_id`
- `publication_list`
- `issue_list`
- `article_count`
- `warning_summary`
- `accepted_anomaly_summary`
- `promotion_decision`
- `built_at`
- `git_context`

## Reused Inputs

- OPS2 promotion evaluation
- OPS3 release notes / manifest / provenance pattern
- DATA2 accepted warning / budget decision

## Non-goals

- 不做远程对象存储
- 不做 CDN invalidation
- 不做多环境 secrets 管理
