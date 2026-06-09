# Navigation And Return State

## Requirement

- 从详情页返回首页时必须保留：
  - scroll position
  - 当前 tab
  - 当前 filter

## Strategy

- `store`:
  - `mobile/stores/discovery.store.js` 持有 `feedUi`
  - 字段包括 `activeTab / publicationKey / updateType / scrollTop / restorePending`
- `local cache`:
  - 通过 `buildUiStateCacheKey("feed-ui1")` 落到本地缓存
  - 这样 tab 页被重建后仍能恢复 UI 选择
- `in-memory`:
  - 页面运行过程中直接依赖 store 响应式状态
  - 减少 route query 污染
- `route query`:
  - 只用于旧 route alias 的 focus 提示
  - 不把长期 scroll/filter 状态编码到 URL

## Why This Choice

- scrollTop 属于高频变化状态，放 route query 成本高且脆弱。
- tab/filter 属于 UI 会话状态，放 discovery store 最直接。
- 用 cache 做兜底，能覆盖 tab 页重建和应用恢复。
- 不修改 Stage E0/E2 canonical content/detail/pricing/entitlement cache keys。

## Flow

1. 首页滚动时持续写入 `scrollTop`
2. 切 tab / 切筛选时写入 `feedUi`
3. 打开详情前将 `restorePending = true`
4. 首页 `onShow` 时读取并消费 restore 标记
5. 使用 `uni.pageScrollTo` 恢复原位置
