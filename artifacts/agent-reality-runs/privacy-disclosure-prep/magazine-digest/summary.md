# privacy-disclosure-prep M1 Reality Output

readiness: RED
product_key: demo_cn_content
scenario_id: data2_multi_publication_release_candidate
source_bundle: `runtime/releases/rel_data2_multi_publication_release_candidate_20260323T121747Z/bundle.json`

## Real Magazine Digest Samples
- `art_rd_12112025_001` / Reader's Digest / 23项冬季生活锦囊 / hash `8a3499662e1b9c93c80f0e7b706d11fb8e16dff5`
- `art_barrons_09022026_001` / Barron's / 华尔街风云：情绪化的市场 / hash `199b7767a12e317e5e8caec3abeb69afbddaaac9`
- `art_the_atlantic_012026_001` / The Atlantic / 2026年1月刊前瞻：秩序的终结与机构的重塑 / hash `002d97bb7924f4e68d1b59e9e39292bad9289725`

## Material Claims
- `privacy-disclosure-prep.m1.real_content_bundle_observed`: observed_in_repo / C0 / evidence=evidence.privacy-disclosure-prep.runtime_bundle_metadata, evidence.privacy-disclosure-prep.content_volume
- `privacy-disclosure-prep.m1.real_article_samples_observed`: observed_in_repo / C1 / evidence=evidence.privacy-disclosure-prep.publication_catalog, evidence.privacy-disclosure-prep.sample_article_variants
- `privacy-disclosure-prep.m1.privacy_data_surfaces_observed`: observed_in_repo / C2 / evidence=evidence.privacy-disclosure-prep.runtime_bundle_metadata, evidence.privacy-disclosure-prep.existing_agent_output
- `privacy-disclosure-prep.m1.privacy_policy_url_needs_human`: needs_human / C4 / evidence=evidence.privacy-disclosure-prep.human_gate
- `privacy-disclosure-prep.m1.sdk_inventory_not_final`: needs_human / C3 / evidence=evidence.privacy-disclosure-prep.existing_agent_output, evidence.privacy-disclosure-prep.human_gate

## Human Review
- human_review_count: 2
- final privacy/legal/store claims: not allowed
