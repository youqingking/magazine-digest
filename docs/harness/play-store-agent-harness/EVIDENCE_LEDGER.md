# Evidence Ledger

The evidence ledger is the normalized source list used by claim validators.
Every non-missing claim must cite at least one ledger entry.

## Evidence Ledger Schema

Required ledger fields:

- `evidence_id`
- `source_type`
- `source_ref`
- `observed_value`
- `status`
- `collected_by`
- `collected_at`
- `validator`
- `limitations`
- `product_key_scope`
- `human_review_required`

## Source Types

- `repo_file`
- `repo_command`
- `validator_result`
- `owner_decision`
- `m0_audit`
- `blocked_external_source`

## Minimal JSON Shape

```json
{
  "schema_version": "play_store_evidence_ledger.v1",
  "run_id": "local-dry-run-YYYYMMDD-HHMMSS",
  "entries": [
    {
      "evidence_id": "evidence.m0.agno_status",
      "source_type": "m0_audit",
      "source_ref": "docs/agno/AGNO_RUNTIME_CHECK.md",
      "observed_value": "Agno status is dry_run_only.",
      "status": "observed_in_repo",
      "collected_by": "codex",
      "collected_at": "local-run",
      "validator": "validate_play_store_agent_harness.py",
      "limitations": [
        "No repo Agno dependency, runner, or step artifact is present."
      ],
      "product_key_scope": "not_applicable",
      "human_review_required": false
    }
  ]
}
```

## Evidence Rules

- `observed_in_repo` requires a repo file, repo command, or validator result.
- `inferred` requires source evidence and a limitation explaining the inference.
- `missing` requires a missing source ref and owner action if user-facing impact exists.
- `blocked` requires a blocker source and owner action.
- `needs_human` requires a human approval gate entry.
- `not_applicable` requires a reason.
- `C3`, `C4`, and `C5` ledger entries must preserve human-review boundaries.

## M2 Old Four Evidence Ledger

`run_id`: `play-store-m2-old-four-20260612`

These entries bind the old four Play Store agents to real repo evidence. They do not run real Agno, do not call Play Console, and do not execute C5 actions.

| evidence_id | source_type | source_ref | observed_value | status | collected_by | validator | product_key_scope | human_review_required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `evidence.rba.npm_ci` | `repo_command` | `npm.cmd ci` | exit 0 | `observed_in_repo` | `codex` | `validate_release_build_agent.py` | `not_applicable` | false |
| `evidence.rba.typecheck` | `repo_command` | `npm.cmd --prefix apps/mobile run typecheck` | exit 0 | `observed_in_repo` | `codex` | `validate_release_build_agent.py` | `not_applicable` | false |
| `evidence.rba.smoke_fixture` | `repo_command` | `npm.cmd --prefix apps/mobile run smoke:fixture` | fixture smoke passed; Supabase unavailable missing_env | `observed_in_repo` | `codex` | `validate_release_build_agent.py` | `demo_cn_content` | false |
| `evidence.rba.start_smoke` | `repo_command` | `npm.cmd --prefix apps/mobile run start:smoke` | Expo start smoke passed | `observed_in_repo` | `codex` | `validate_release_build_agent.py` | `not_applicable` | false |
| `evidence.rba.preflight` | `repo_command` | `npm.cmd run validate:preflight` | exit 0 | `observed_in_repo` | `codex` | `validate_release_build_agent.py` | `not_applicable` | false |
| `evidence.rba.android_build_missing` | `blocked_external_source` | signed Android AAB/APK or EAS build | no signed artifact produced | `blocked` | `codex` | `validate_release_build_agent.py` | `not_applicable` | true |
| `evidence.rba.play_console_missing` | `blocked_external_source` | Play Console account/app/credentials | unavailable and not approved for this run | `blocked` | `codex` | `validate_release_build_agent.py` | `not_applicable` | true |
| `evidence.pdp.data_inventory` | `repo_file` | `docs/privacy/DATA_INVENTORY.md` | current data surfaces and missing human decisions recorded | `observed_in_repo` | `codex` | `validate_privacy_disclosure_prep.py` | `demo_cn_content` | true |
| `evidence.pdp.smoke_fixture` | `repo_command` | `npm.cmd --prefix apps/mobile run smoke:fixture` | fixture smoke passed | `observed_in_repo` | `codex` | `validate_privacy_disclosure_prep.py` | `demo_cn_content` | false |
| `evidence.pdp.sdk_inventory` | `repo_file` | `docs/privacy/SDK_INVENTORY.md` | SDK inventory draft records current repo evidence | `observed_in_repo` | `codex` | `validate_privacy_disclosure_prep.py` | `not_applicable` | true |
| `evidence.pdp.service_seams` | `repo_file` | `packages/core-runtime/src/seams/**` | service seams are reserved and need review | `needs_human` | `codex` | `validate_privacy_disclosure_prep.py` | `not_applicable` | true |
| `evidence.pdp.privacy_policy_missing` | `blocked_external_source` | Privacy policy URL | missing from repo evidence | `needs_human` | `codex` | `validate_privacy_disclosure_prep.py` | `not_applicable` | true |
| `evidence.pdp.data_safety_draft` | `repo_file` | `docs/launch/google-play/data-safety-draft.md` | Data Safety remains draft and human review required | `needs_human` | `codex` | `validate_privacy_disclosure_prep.py` | `not_applicable` | true |
| `evidence.gpl.field_lengths` | `validator_result` | `docs/launch/google-play/listing-validation-report.md` | listing field lengths are inside draft limits | `observed_in_repo` | `codex` | `validate_google_play_listing.py` | `not_applicable` | false |
| `evidence.gpl.source_of_truth` | `repo_file` | `docs/launch/store-fields/source-of-truth.json` | source-of-truth is draft and dry-run only | `observed_in_repo` | `codex` | `validate_google_play_listing.py` | `not_applicable` | true |
| `evidence.gpl.mobile_runtime` | `repo_file` | `docs/mobile/MOBILE_RUNTIME_SHELL.md` | implemented shell and service seam boundaries documented | `observed_in_repo` | `codex` | `validate_google_play_listing.py` | `not_applicable` | false |
| `evidence.gpl.localized_listing` | `repo_file` | `docs/launch/google-play/listing.*.json` | localized listing drafts are human review required | `needs_human` | `codex` | `validate_google_play_listing.py` | `not_applicable` | true |
| `evidence.gpl.play_console_not_attempted` | `blocked_external_source` | Play Console | API and submission remain out of scope | `needs_human` | `codex` | `validate_google_play_listing.py` | `not_applicable` | true |
| `evidence.ss.route_index` | `repo_file` | `apps/mobile/app/index.tsx` | index route exists | `observed_in_repo` | `codex` | `validate_screenshot_storyboard.py` | `not_applicable` | false |
| `evidence.ss.route_article` | `repo_file` | `apps/mobile/app/article/[articleId].tsx` | article route exists | `observed_in_repo` | `codex` | `validate_screenshot_storyboard.py` | `not_applicable` | false |
| `evidence.ss.route_debug` | `repo_file` | `apps/mobile/app/debug.tsx` | debug route exists | `observed_in_repo` | `codex` | `validate_screenshot_storyboard.py` | `not_applicable` | false |
| `evidence.ss.shot_list` | `repo_file` | `docs/launch/screenshots/shot-list.json` | four shots map to allowed routes | `observed_in_repo` | `codex` | `validate_screenshot_storyboard.py` | `demo_cn_content` | true |
| `evidence.ss.fixture_scenario` | `repo_command` | `npm.cmd --prefix apps/mobile run smoke:fixture` | `s01_normal_full_matrix` loads | `observed_in_repo` | `codex` | `validate_screenshot_storyboard.py` | `demo_cn_content` | false |
| `evidence.ss.storyboard` | `repo_file` | `docs/launch/screenshots/storyboard.md` | storyboard draft exists | `needs_human` | `codex` | `validate_screenshot_storyboard.py` | `not_applicable` | true |
| `evidence.ss.human_review` | `repo_file` | `docs/launch/screenshots/screenshot-human-review-required.md` | screenshot capture/public-use gates require human review | `needs_human` | `codex` | `validate_screenshot_storyboard.py` | `not_applicable` | true |

M2 claim count: 20. M2 evidence entry count: 25. M2 human approval gated claim count: 10.

## M4 8-agent Evidence Ledger

`run_id`: `play-store-m4-8-agent-launch-prep-20260612`

M4 keeps the old four M2 evidence rows and adds the remaining four L2 agents. Agno remains `dry_run_only`; no Play Console, credentials, submission, or production action is executed.

| evidence_id | source_type | source_ref | observed_value | status | collected_by | validator | product_key_scope | human_review_required |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `evidence.lic.mobile_app_config` | `repo_file` | `apps/mobile/app.json` | app name, slug, and scheme observed | `observed_in_repo` | `codex` | `validate_launch_info_collector.py` | `not_applicable` | false |
| `evidence.lic.listing_draft` | `repo_file` | `docs/launch/google-play/listing.*.json` | public listing name inferred from draft listing JSON | `inferred` | `codex` | `validate_launch_info_collector.py` | `not_applicable` | true |
| `evidence.lic.android_package_missing` | `repo_file` | `apps/mobile/app.json` | production android.package missing in current app config | `needs_human` | `codex` | `validate_launch_info_collector.py` | `not_applicable` | true |
| `evidence.lic.eas_missing` | `blocked_external_source` | EAS owner/projectId/build profile | owner-confirmed EAS identity missing | `needs_human` | `codex` | `validate_launch_info_collector.py` | `not_applicable` | true |
| `evidence.lic.play_console_missing` | `blocked_external_source` | Play Console account/app | no Play Console app evidence exists | `blocked` | `codex` | `validate_launch_info_collector.py` | `not_applicable` | true |
| `evidence.lic.privacy_policy_missing` | `blocked_external_source` | Privacy policy URL | missing from repo evidence | `needs_human` | `codex` | `validate_launch_info_collector.py` | `not_applicable` | true |
| `evidence.lic.developer_contact_missing` | `blocked_external_source` | Developer contact | missing from repo evidence | `needs_human` | `codex` | `validate_launch_info_collector.py` | `not_applicable` | true |
| `evidence.lic.store_category_missing` | `blocked_external_source` | Google Play category | missing from repo evidence | `needs_human` | `codex` | `validate_launch_info_collector.py` | `not_applicable` | true |
| `evidence.lic.content_rating_missing` | `blocked_external_source` | Content rating | missing from repo evidence | `needs_human` | `codex` | `validate_launch_info_collector.py` | `not_applicable` | true |
| `evidence.lic.target_audience_missing` | `blocked_external_source` | Target audience | missing from repo evidence | `needs_human` | `codex` | `validate_launch_info_collector.py` | `not_applicable` | true |
| `evidence.gdsa.data_inventory` | `repo_file` | `docs/privacy/DATA_INVENTORY.md` | data inventory draft exists | `observed_in_repo` | `codex` | `validate_google_data_safety_agent.py` | `demo_cn_content` | true |
| `evidence.gdsa.sdk_inventory` | `repo_file` | `docs/privacy/SDK_INVENTORY.md` | SDK inventory draft exists | `observed_in_repo` | `codex` | `validate_google_data_safety_agent.py` | `not_applicable` | true |
| `evidence.gdsa.fixture_smoke` | `repo_command` | `npm.cmd --prefix apps/mobile run smoke:fixture` | fixture smoke passed; Supabase unavailable missing_env | `observed_in_repo` | `codex` | `validate_google_data_safety_agent.py` | `demo_cn_content` | false |
| `evidence.gdsa.service_seams` | `repo_file` | `packages/core-runtime/src/seams/**` | Supabase, RevenueCat, and Push are reserved seams | `needs_human` | `codex` | `validate_google_data_safety_agent.py` | `not_applicable` | true |
| `evidence.gdsa.human_review_gate` | `repo_file` | `docs/launch/google-play/data-safety-human-review-required.md` | Data Safety human review gates remain open | `needs_human` | `codex` | `validate_google_data_safety_agent.py` | `not_applicable` | true |
| `evidence.sca.adb_available` | `repo_command` | `where.exe adb` | adb.exe found under Android SDK platform-tools | `observed_in_repo` | `codex` | `validate_screenshot_capture_agent.py` | `not_applicable` | false |
| `evidence.sca.no_attached_device` | `repo_command` | `adb devices` | no attached Android device rows | `blocked` | `codex` | `validate_screenshot_capture_agent.py` | `not_applicable` | true |
| `evidence.sca.shot_list` | `repo_file` | `docs/launch/screenshots/shot-list.json` | four planned shots map to existing routes | `observed_in_repo` | `codex` | `validate_screenshot_capture_agent.py` | `demo_cn_content` | true |
| `evidence.sca.public_asset_review` | `repo_file` | `docs/launch/screenshots/screenshot-human-review-required.md` | screenshot public-use gates remain open | `needs_human` | `codex` | `validate_screenshot_capture_agent.py` | `not_applicable` | true |
| `evidence.lpa.manifest` | `repo_file` | `artifacts/launch-package/manifest.json` | 8-agent outputs and Agno artifacts listed | `observed_in_repo` | `codex` | `validate_launch_package_agent.py` | `not_applicable` | false |
| `evidence.lpa.validators` | `repo_file` | `scripts/agent_tools/validate_play_store_agent_mvp.py` | aggregate validator includes 8-agent checks | `observed_in_repo` | `codex` | `validate_launch_package_agent.py` | `not_applicable` | false |
| `evidence.lpa.readiness_report` | `repo_file` | `artifacts/launch-package/readiness-report.md` | readiness RED due to unresolved gates | `blocked` | `codex` | `validate_launch_package_agent.py` | `not_applicable` | true |
| `evidence.lpa.play_console_blocker` | `blocked_external_source` | Play Console credentials/API/submission/rollout | out of scope for dry-run package | `blocked` | `codex` | `validate_launch_package_agent.py` | `not_applicable` | true |
| `evidence.lpa.pr_body_draft` | `repo_file` | `artifacts/launch-package/readiness-report.md` | PR title/body draft present | `needs_human` | `codex` | `validate_launch_package_agent.py` | `not_applicable` | true |

8-agent claim count: 39. 8-agent evidence entry count: 49. 8-agent human-gated claim count: 21.
