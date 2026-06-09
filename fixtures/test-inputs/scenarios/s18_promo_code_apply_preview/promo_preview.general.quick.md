---
scenario_id: s18_promo_code_apply_preview
article_variant_id: var_s18_promo_preview_general_quick_r1
article_id: art_s18_promo_preview
article_uid: syn_article_s18_promo_preview
product_key: demo_cn_content
publication_key: market_watch
language: zh-CN
audience_segment: general
reading_mode: quick_30s
title: 券码预览：有效、失效与地板价保护
deck: 一则虚构 promo code 输入样本，用于 Stage G paywall 中的 preview-only 输入框与结果展示。
tags: ["market", "productivity"]
premium_tier: premium
publish_status: published
publish_at: 2026-03-17T09:58:00+08:00
updated_at: 2026-03-17T09:58:00+08:00
revision: 1
fallback_policy: allow_same_audience_only
source_kind: synthetic
---
一句话摘要：同一个输入框需要把有效、无效、不适用和地板价保护这几类结果都讲清楚，而且不能误导成已经真实兑换。

关键要点：
- promo preview 只返回结果，不做真实落账。
- floor guard 是 canonical 规则，不能被券码绕过。
- duplicate 或 ineligible 需要明确落在 not_applicable 一类结果里。

为什么重要：
它让 Stage G 的商业输入框先变得可运行、可测试，但不越界到 Stage H/I 的真实闭环。
