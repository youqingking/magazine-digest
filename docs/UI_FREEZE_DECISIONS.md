# UI Freeze Decisions

## Scope Lock

- 本次只做 `mobile` 前台结构冻结，不做主线整合。
- 不改 Stage B canonical contracts。
- 不改 backend contracts、schema、payment semantics。
- 样式调整仅服务结构验证，不做 UI1.5 视觉整合。

## Current Drift And Resolution

| Drift / conflict | Freeze decision |
| --- | --- |
| `inbox`、`follows`、`campaign` 仍保留独立 route，容易被误读成正式一级页面 | 保留 route 仅做兼容 alias；正式 IA 只认最终 7 页 |
| alias route 已跳转，但目标页对 `focus` 消费不完整 | 首页继续消费 `focus=inbox`；搜索页补消费 `focus=follows`；订阅页补消费 `focus=campaign` |
| inbox 在首页已经归位，但我的页只有 unread 指标，没有摘要承接 | 我的页保留最小消息摘要卡，只做摘要视图，不恢复独立 inbox 页面 |
| detail 已基本是唯一阅读页，但需要在冻结文档中明确成为唯一阅读入口 | 明确 `pages/detail/index` 为唯一阅读页，所有文章入口默认进 `quick_30s`，顶部切到 `deep_3m` |
| 返回链路要求已在 store 中实现，但还未作为最终冻结规范写死 | 冻结为：首页返回保留 `scrollTop`、`activeTab`、`publicationKey`、`updateType`；不把这些长期状态编码进 route |

## Final 7 Official Pages

| Official page | Responsibility |
| --- | --- |
| 首页 | 内容入口、继续阅读、稍后再读、关注更新、inbox 主摘要 |
| 文章详情页 | 唯一阅读页；统一承接 `quick_30s` / `deep_3m` 两种阅读模式 |
| 搜索页 | 搜索、筛选、关注目录、follow/unfollow 动作 |
| 订阅页 | 套餐、权益、quota/offer 展示、promo preview、campaign 商业上下文 |
| 邀请/兑换页 | referral summary、invite code、奖励摘要、redeem preview |
| 我的页 | 个人摘要、保存内容、权益摘要、消息摘要、设备/账号摘要入口 |
| 设置页 | runtime、通知偏好、阅读默认值、设备/账号基础状态、调试态基础信息 |

## Alias And Redirect Policy

| Old page / route | Frozen behavior |
| --- | --- |
| `/pages/inbox/index` | alias only，redirect 到 `/pages/feed/index?focus=inbox` |
| `/pages/follows/index` | alias only，redirect 到 `/pages/search/index?focus=follows` |
| `/pages/campaign/index` | alias only，redirect 到 `/pages/paywall/index?focus=campaign` |
| `pages/auth-test/*` | 不进入正式 IA，不放回最终 7 页 |

## Reading Chain

- `pages/detail/index` 是唯一阅读页。
- 首页、搜索页、我的页、消息摘要中的文章点击，默认都以 `readingMode=quick_30s` 打开详情。
- `deep_3m` 只允许在 detail 页顶部切换，不新开第二阅读页。
- `teen / general / adult` 继续走既有 audience 参数，不改 detail cache key 语义。

## Return Chain

- 从 detail 返回首页时必须保留：
  - `scrollTop`
  - `activeTab`
  - `publicationKey`
  - `updateType`
- 这些状态保存在 `discovery.store.js` 的 `feedUi` 中，并通过本地 cache 兜底。
- route query 只用于 alias 的落点提示，不承担长期 UI 会话状态。
- 从 detail 返回搜索页或我的页，沿用系统返回栈；本次冻结不新增独立的搜索会话 store。

## Re-home Decisions

- `inbox`：
  - 主归位到首页消息摘要
  - 次归位到我的页消息摘要
- `follows`：
  - 主归位到搜索页关注目录
  - 次归位到首页关注更新
- `campaign`：
  - 归位到订阅页商业上下文
- `saved_for_later`：
  - 首页 saved 视角
  - 我的页摘要区

## Non-goals

- 不减少或重写底层 store/service 能力。
- 不接支付 provider，不改变套餐/权益语义。
- 不删除 alias route。
- 不做 UI1.5 大规模视觉重绘。
