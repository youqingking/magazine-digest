---
scenario_id: s06_tombstone_and_unpublish
article_variant_id: var_s06_withdrawn_notice_general_quick_r1
article_id: art_s06_withdrawn_notice
article_uid: syn_article_s06_withdrawn_notice
product_key: demo_cn_content
publication_key: world_brief
language: zh-CN
audience_segment: general
reading_mode: quick_30s
title: 已撤回：旧版应急演练通告
deck: 这份虚构内容专门用于 tombstone 和 archived 可见性测试，已不应继续被阅读。
tags: ["policy"]
premium_tier: free
publish_status: archived
publish_at: 2026-03-17T08:10:00+08:00
updated_at: 2026-03-17T09:18:00+08:00
revision: 1
fallback_policy: allow_same_audience_only
source_kind: synthetic
---
一句话摘要：这是一份已经撤回的旧版演练通告样本，用于测试客户端在收到下线信号后能否停止展示正文。

关键要点：
- 文本本身仍然存在于 source 中，方便生成 tombstone 对照。
- runtime read path 不应继续把它当作可读内容。
- 任何缓存命中都应被更新的 tombstone 覆盖。

为什么重要：
withdrawn 内容是 sync 和 detail 规则最容易出现不一致的地方，这个样本专门拿来做 smoke。
