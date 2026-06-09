---
scenario_id: s06_tombstone_and_unpublish
article_variant_id: var_s06_scheduled_lab_general_quick_r1
article_id: art_s06_scheduled_lab
article_uid: syn_article_s06_scheduled_lab
product_key: demo_cn_content
publication_key: ai_digest
language: zh-CN
audience_segment: general
reading_mode: quick_30s
title: 明晨发布：协作实验室公告
deck: 这份虚构快讯安排在未来时间生效，用于验证 scheduled 但未到时间的 detail 不可读。
tags: ["ai", "policy"]
premium_tier: free
publish_status: scheduled
publish_at: 2026-03-18T08:00:00+08:00
updated_at: 2026-03-17T09:30:00+08:00
revision: 1
fallback_policy: allow_same_audience_only
source_kind: synthetic
---
一句话摘要：这是一条排入明晨发布的协作实验室公告样本，当前时点不应对读者开放。

关键要点：
- 文本存在，便于验证未来发布窗口。
- 当前 runtime_now 早于 publish_at。
- sync 可以携带这条变更，但 detail 不能把它解析成可读正文。

为什么重要：
scheduled 场景帮助后续阶段把“已同步”和“可阅读”这两件事清楚分开。
