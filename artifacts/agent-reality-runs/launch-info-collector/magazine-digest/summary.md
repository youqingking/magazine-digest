# launch-info-collector M1 Reality Output

readiness: YELLOW
product_key: demo_cn_content
scenario_id: data2_multi_publication_release_candidate
source_bundle: `runtime/releases/rel_data2_multi_publication_release_candidate_20260323T121747Z/bundle.json`

## Real Magazine Digest Samples
- `art_rd_12112025_001` / Reader's Digest / 23项冬季生活锦囊 / hash `8a3499662e1b9c93c80f0e7b706d11fb8e16dff5`
- `art_barrons_09022026_001` / Barron's / 华尔街风云：情绪化的市场 / hash `199b7767a12e317e5e8caec3abeb69afbddaaac9`
- `art_the_atlantic_012026_001` / The Atlantic / 2026年1月刊前瞻：秩序的终结与机构的重塑 / hash `002d97bb7924f4e68d1b59e9e39292bad9289725`

## Material Claims
- `launch-info-collector.m1.real_content_bundle_observed`: observed_in_repo / C0 / evidence=evidence.launch-info-collector.runtime_bundle_metadata, evidence.launch-info-collector.content_volume
- `launch-info-collector.m1.real_article_samples_observed`: observed_in_repo / C1 / evidence=evidence.launch-info-collector.publication_catalog, evidence.launch-info-collector.sample_article_variants
- `launch-info-collector.m1.source_of_truth_can_include_product_key`: observed_in_repo / C1 / evidence=evidence.launch-info-collector.runtime_bundle_metadata, evidence.launch-info-collector.sample_article_variants
- `launch-info-collector.m1.play_console_fields_need_human`: needs_human / C4 / evidence=evidence.launch-info-collector.existing_agent_output, evidence.launch-info-collector.human_gate
- `launch-info-collector.m1.downstream_inputs_are_draft`: blocked / C5 / evidence=evidence.launch-info-collector.existing_agent_output

## Human Review
- human_review_count: 2
- final privacy/legal/store claims: not allowed
