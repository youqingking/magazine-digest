# RC1 Manual Runtime Checklist

- generated_at: 2026-03-21T11:06:27.490Z
- expected_branch: rc/ui35-runtime-closeout-kit
- expected_head_sha: 19df248
- baseline_tag: baseline-ui3-data1d-test1-ops1
- selected_scenario_id: data1a_readers_digest_12112025
- current_runtime_scenario_id: data1a_readers_digest_12112025
- current_mirror_scenario_id: data1a_readers_digest_12112025

Fill `output/stage-rc1/runtime-closeout-template.json` while running a real H5 or HBuilderX session.

## Blocker Items
1. Bottom tab bar shows exactly 3 tabs
- id: tabbar_three_tabs
- screenshot_required: yes
- required_text_keys: observed_tab_count, observed_tab_labels
2. Tabs are feed, search or 来源, and profile; second tab still routes to /pages/search/index
- id: tabbar_feed_search_profile
- screenshot_required: yes
- required_text_keys: observed_second_tab_label, observed_search_route_note
3. detail is entered only from content click
- id: detail_entry_content_only
- screenshot_required: yes
- required_text_keys: detail_entry_surface
4. detail defaults to quick_30s
- id: detail_default_quick_30s
- screenshot_required: yes
- required_text_keys: detail_article_id, default_mode_observed
5. detail switches to deep_3m correctly
- id: detail_switch_deep_3m
- screenshot_required: yes
- required_text_keys: deep_mode_toggle_result
6. Returning from detail to feed restores feed state normally
- id: detail_return_feed_state
- screenshot_required: yes
- required_text_keys: feed_restore_note
7. settings shows Build Audit
- id: settings_build_audit_visible
- screenshot_required: yes
- required_text_keys: observed_build_branch, observed_build_sha, observed_build_baseline_tag
8. Running package provenance matches current source expectations
- id: runtime_package_from_current_source
- screenshot_required: yes
- required_text_keys: provenance_check_note, observed_build_timestamp
9. selected/current scenario information matches expected context
- id: scenario_alignment
- screenshot_required: yes
- required_text_keys: observed_runtime_scenario_id, observed_current_mirror_scenario_id
10. paywall, invite, and settings remain reachable as non-tab formal entries
- id: non_tab_routes_reachable
- screenshot_required: yes
- required_text_keys: paywall_entry_note, invite_entry_note, settings_entry_note
11. baseline or mixed scenario does not crash core pages during manual run
- id: baseline_or_mixed_stable
- screenshot_required: yes
- required_text_keys: scenario_exercised, stability_observation
12. No recurring detail template compile/runtime error appears
- id: no_detail_compile_regression
- screenshot_required: yes
- required_text_keys: compile_surface_checked, compile_check_note
