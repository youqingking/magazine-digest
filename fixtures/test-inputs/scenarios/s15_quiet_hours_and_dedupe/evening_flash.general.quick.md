---
scenario_id: s15_quiet_hours_and_dedupe
article_variant_id: var_s15_evening_flash_general_quick_r1
article_id: art_s15_evening_flash
article_uid: syn_article_s15_evening_flash
product_key: demo_cn_content
publication_key: world_brief
language: zh-CN
audience_segment: general
reading_mode: quick_30s
title: 夜间快报二次投递被合并到同一条记录
deck: quiet hours 与 dedupe 联合场景。
tags: ["policy"]
premium_tier: free
publish_status: published
publish_at: 2026-03-17T21:30:00+08:00
updated_at: 2026-03-17T21:50:00+08:00
revision: 1
publish_batch_id: pb_s15_quiet_drop
update_type: new_publish
update_priority: normal
change_summary: 夜间快报进入 inbox，push 被抑制
notify_level: eligible_users
is_breaking: false
available_from: 2026-03-17T21:30:00+08:00
fallback_policy: allow_same_audience_only
source_kind: synthetic
---
一句话摘要：夜间快报在 quiet hours 内发布，系统把两次推送尝试压回同一条 inbox 记录。

关键要点：
- 第一次 push 因 quiet hours 被抑制。
- 第二次相同来源的投递因为 dedupe 直接复用既有 inbox 项。
- 用户醒来后仍然应该能在 inbox 里看到完整记录。

为什么重要：
它验证了 inbox 是 durable truth，而 push 只是后续阶段才会接入的运输层。
