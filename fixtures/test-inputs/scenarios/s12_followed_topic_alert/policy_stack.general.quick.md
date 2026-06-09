---
scenario_id: s12_followed_topic_alert
article_variant_id: var_s12_policy_stack_general_quick_r1
article_id: art_s12_policy_stack
article_uid: syn_article_s12_policy_stack
product_key: demo_cn_content
publication_key: ai_digest
language: zh-CN
audience_segment: general
reading_mode: quick_30s
title: 模型治理周报把政策条目合成跟进清单
deck: 用于 follow 告警和 inbox alert 的最小内容。
tags: ["ai", "policy"]
premium_tier: free
publish_status: published
publish_at: 2026-03-17T09:10:00+08:00
updated_at: 2026-03-17T09:16:00+08:00
revision: 1
publish_batch_id: pb_s12_follow_alert
update_type: new_publish
update_priority: high
change_summary: 关注主题命中新内容
notify_level: followed_only
is_breaking: false
available_from: 2026-03-17T09:10:00+08:00
fallback_policy: allow_same_audience_only
source_kind: synthetic
---
一句话摘要：模型治理周报把新政策条目和团队待办合成一张跟进清单，方便追踪主题变化。

关键要点：
- 文章同时命中 publication `ai_digest` 和 tag `policy`。
- 这让 follow-catalog 和 follow-toggle 的双维度联动可以被测试。
- 同一条内容应该出现在 followed_updates，也应该生成 inbox alert。

为什么重要：
它是验证 follow 边命中新内容时，首页模块、inbox 列表和事件埋点能否一起工作的最小样本。
