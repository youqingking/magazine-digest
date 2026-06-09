# Stage OPS5 Audit Policy

## Required Audit Coverage

Every OPS5 mutation must emit:

- `actor`: `local_op`
- `mode`: `local_op`
- `entity_type`
- `entity_id`
- `action`
- `before`
- `after`
- `timestamp`
- `success`
- `failure_code` / `failure_message` when applicable
- `triggered_follow_up_actions`
- `lock_name`
- `observability_event_id` when generated

## Actions That Must Be Audited

- publication create/edit/archive/unarchive
- issue create/edit/archive/unarchive
- article override create/edit/delete
- taxonomy mapping create/edit/disable
- scenario membership include/exclude/classification edit
- rebuild candidate triggered from OPS5

## Output Files

- `output/stage-ops5/crud-audit-log.json`
- `output/stage-ops5/entity-change-report.json`
- `output/stage-ops5/rebuild-trigger-report.json`

## Audit Rules

1. Audit is append-preserving. Existing entries are retained.
2. Failed writes still produce audit entries.
3. Before/after snapshots are entity-scoped and machine-readable.
4. Follow-up refreshes are recorded separately from the primary mutation result.
5. Audit logs are local files and support rollback review, not full compliance archiving.

## Observability Link

- CRUD actions also emit OBS1 events with operator context.
- Failure severity:
  - validation/user-correctable: `warning`
  - write/rebuild failure: `error`
  - lock or baseline safety violation: `critical`
