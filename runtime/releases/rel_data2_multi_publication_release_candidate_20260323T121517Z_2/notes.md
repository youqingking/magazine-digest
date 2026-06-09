# Release rel_data2_multi_publication_release_candidate_20260323T121517Z_2

- scenario: data2_multi_publication_release_candidate
- baseline: data1a_readers_digest_12112025
- publications: barrons, readers_digest, science, the_atlantic, the_economist
- issues: barrons__09022026, readers_digest__12112025, science__20260323, the_atlantic__012026, the_economist__20260314
- article_count: 118
- decision: promotable

## 为什么可发布

- 当前 candidate 已通过 OPS2 promotion decision。
- mixed preview 仍是 preview-only，因此不作为正式 release source。

## 警告摘要

- 无

## 已接受例外

- the_economist__20260314: economist_section_context_fallback x1
- the_economist__20260314: economist_filename_anomaly x1

- overrides: 10
