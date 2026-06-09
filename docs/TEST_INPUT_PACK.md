# Synthetic Test Input Pack

## Scope

Stage X adds a lightweight synthetic content pack for downstream Stage E1 / F / G smoke and regression work. The pack is fictional only, rebuildable from canonical source files, and does not replace Stage B/D/E0 canonical seed or runtime fixtures.

## Canonical Source

- `fixtures/test-inputs/scenarios/`: scenario families, markdown variants, scenario metadata, expected outcomes
- `fixtures/test-inputs/publications/publications.json`: synthetic publication catalog
- `fixtures/test-inputs/manifests/*.json`: pack-level product, pricing, campaign, experiment, and scenario index metadata

## Generated Targets

- `output/test-input-pack/runtime/*.bundle.json`
- `output/test-input-pack/reports/*.json`
- `mobile/fixtures/runtime/scenarios/*.bundle.json`
- `mobile/fixtures/runtime/current/*` after selector projection
- future F1 planning inputs: publish-batch summaries, inbox records, follow-state overlays, and notification preference overlays within the same synthetic runtime bundles

## Workflow

1. `npm run build:test-inputs`
2. `npm run validate:test-inputs`
3. `npm run export:runtime-scenarios`
4. `npm run select:runtime-scenario -- --scenario-id s01_normal_full_matrix`
5. `npm run smoke:test-inputs`

## Guardrails

- Synthetic markdown files are the source of truth for article bodies.
- Generated bundles are disposable artifacts and may be deleted and rebuilt at any time.
- Scenario selector writes only `mobile/fixtures/runtime/current/` and `output/test-input-pack/reports/current-scenario.json`.
- The default Stage E0 runtime fixtures remain side-by-side and untouched.
- Stage F0 only adds planning metadata for `s11_new_publish_batch`, `s12_followed_topic_alert`, `s13_inbox_digest`, `s14_revision_highlight`, and `s15_quiet_hours_and_dedupe`; it does not require runtime fixture regeneration yet.

## F0 Planning Additions

- Each Stage F0 scenario family should define:
  - at least one `publish_batch_id`
  - variant-level `update_type`, `update_priority`, `change_summary`, `notify_level`, `is_breaking`, `available_from`, and optional `available_until`
  - matching `user_follows`, `user_notification_prefs`, `notification_inbox`, and `user_content_state` overlays when the scenario depends on them
- `s13_inbox_digest` should model multiple source items merging into one digest inbox entry plus per-item provenance.
- `s15_quiet_hours_and_dedupe` should include both suppressed push attempts and retained inbox rows so channel precedence can be verified.
