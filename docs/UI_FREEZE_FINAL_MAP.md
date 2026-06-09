# UI Freeze Final Map

## Final Route Map

| Type | Route | Final responsibility | Notes |
| --- | --- | --- | --- |
| Official | `/pages/feed/index` | 首页 | 正式一级入口 |
| Official | `/pages/detail/index` | 文章详情页 | 唯一阅读页 |
| Official | `/pages/search/index` | 搜索页 | 正式一级入口 |
| Official | `/pages/paywall/index` | 订阅页 | 正式一级入口 |
| Official | `/pages/invite/index` | 邀请/兑换页 | 正式一级入口 |
| Official | `/pages/profile/index` | 我的页 | 正式一级入口 |
| Official | `/pages/settings/index` | 设置页 | 正式二级页面，保留正式职责 |
| Alias | `/pages/inbox/index` | inbox alias | redirect 到首页消息摘要 |
| Alias | `/pages/follows/index` | follows alias | redirect 到搜索页关注目录 |
| Alias | `/pages/campaign/index` | campaign alias | redirect 到订阅页商业区块 |

## Responsibility Matrix

| Capability | Final home | Secondary home |
| --- | --- | --- |
| discovery feed | 首页 | 无 |
| continue reading | 首页 | 我的页摘要 |
| saved for later | 首页 saved 视角 | 我的页摘要 |
| inbox summary | 首页 | 我的页 |
| follows catalog | 搜索页 | 无 |
| followed updates | 首页 | 搜索页筛选上下文 |
| campaign context | 订阅页 | 无 |
| promo preview | 订阅页 | 无 |
| invite / redeem preview | 邀请/兑换页 | 无 |
| runtime / notification prefs | 设置页 | 无 |

## Reading Flow

1. 用户从首页、搜索页、我的页或消息摘要点击文章。
2. 统一跳到 `/pages/detail/index?articleId=...&readingMode=quick_30s&source=...`。
3. detail 默认显示 `quick_30s`。
4. 用户如需 `deep_3m`，只在 detail 顶部切换。
5. detail 不再拆出第二阅读 route，不引入摘要页/精读页双页面。

## Return Flow

1. 首页打开 detail 前，把 `restorePending=true` 写入 `feedUi`。
2. detail 返回首页时，首页在 `onShow` 消费恢复状态。
3. 恢复字段固定为：
   - `activeTab`
   - `publicationKey`
   - `updateType`
   - `scrollTop`
4. alias route 的 `focus` 只用于把用户送到正确页面语义，不负责保存长期状态。

## Structure Freeze Result

- 正式页面冻结为 7 个。
- alias route 保留 3 个，仅为兼容。
- detail 冻结为唯一阅读页。
- inbox / follows / campaign 全部完成归位，不再作为正式一级职责游离存在。
