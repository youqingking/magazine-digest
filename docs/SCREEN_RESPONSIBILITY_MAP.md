# Screen Responsibility Map

## Final Screens

| Final screen | Responsibility |
| --- | --- |
| 首页 | 内容入口、消息摘要、关注更新、继续阅读、稍后再读 |
| 文章详情页 | 唯一阅读页，30 秒速览 / 3 分钟精读切换 |
| 搜索页 | 搜索、筛选、follow 动作 |
| 订阅页 | 套餐、权益、offer、promo preview、campaign context |
| 邀请/兑换页 | referral summary、invite code、redeem preview、reward summary |
| 我的页 | 个人摘要、保存内容、权益摘要、消息摘要 |
| 设置页 | 运行方式、通知偏好、阅读默认值、设备/账号基础状态 |

## Old Page Absorption

| Old page/capability | New home | Exposure |
| --- | --- | --- |
| inbox | 首页消息摘要 / 我的页摘要卡 | 不再暴露为一级入口 |
| follows | 搜索页关注目录 / 首页关注更新 | 不再暴露为一级入口 |
| campaign | 订阅页内部商业区块 | 不再暴露为一级入口 |
| paywall route | 订阅页正式职责 | 保留 |
| auth-test | 不进入正式 IA | 从正式页面列表移除 |

## Temporary Aliases

| Old route | Temporary behavior |
| --- | --- |
| `/pages/inbox/index` | redirect 到首页消息摘要 |
| `/pages/follows/index` | redirect 到搜索页关注目录 |
| `/pages/campaign/index` | redirect 到订阅页商业区块 |

## Notes

- alias 只做兼容，不做长期双重 IA。
- F1/G/H0/H1a stores 和 service 能力仍保留。
