---
scenario_id: s08_experiment_pricing_preview
article_variant_id: var_s08_pricing_lab_adult_quick_r1
article_id: art_s08_pricing_lab
article_uid: syn_article_s08_pricing_lab
product_key: demo_cn_content
publication_key: ai_digest
language: zh-CN
audience_segment: adult
reading_mode: quick_30s
title: 实验提示：内部测试组看到新的订阅说明
deck: 这则虚构说明文把 experiment bucket 和 campaign preview 放在同一输入包里，供后续商业 smoke 使用。
tags: ["ai", "market"]
premium_tier: premium
publish_status: published
publish_at: 2026-03-17T09:44:00+08:00
updated_at: 2026-03-17T09:44:00+08:00
revision: 1
fallback_policy: allow_general
source_kind: synthetic
---
一句话摘要：内部测试组会看到不同的订阅提示文案，但最终价格仍由固定 plan 和 campaign 规则计算。

关键要点：
- experiment 只影响展示分桶，不直接改写结算逻辑。
- campaign preview 会展示内部测试 3 折和 floor guard 对照。
- 这个场景不做真实下单，只提供后续 smoke 所需输入。

为什么重要：
它把 experiment 和 pricing preview 绑在一起，能减少后续阶段手补 fixtures 的次数。
