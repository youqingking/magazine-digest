# IA Merge Map

## Final IA

- 首页：内容入口、消息摘要、关注更新、继续阅读、稍后再读
- 文章详情页：唯一阅读页
- 搜索页：搜索、筛选、follow 动作
- 订阅页：套餐、权益、offer、promo preview、campaign 商业区块
- 邀请/兑换页：referral summary、invite code、redeem preview、reward summary
- 我的页：个人摘要、保存内容、权益摘要、消息摘要
- 设置页：运行方式、通知偏好、阅读默认值、设备/账号基础状态

## Capability Re-home

- `notification_inbox`:
  - 首页消息摘要
  - 我的页摘要指标
- `user_follows` / follow catalog:
  - 搜索页关注目录
  - 首页关注更新
- `campaign landing`:
  - 订阅页内部商业上下文
- `saved_for_later`:
  - 首页 saved tab
  - 我的页摘要区

## Compatibility

- `/pages/inbox/index` -> redirect 到 `/pages/feed/index?focus=inbox`
- `/pages/follows/index` -> redirect 到 `/pages/search/index?focus=follows`
- `/pages/campaign/index` -> redirect 到 `/pages/paywall/index?focus=campaign`

## Why This Merge

- 保留 Stage F1/G 的底层能力，不通过删除 route 或删 store 的方式“完成收敛”。
- 让用户 IA 与底层能力分层：能力保留，页面职责减少。
- 避免长期存在双重首页、双重订阅入口、双重增长入口。
