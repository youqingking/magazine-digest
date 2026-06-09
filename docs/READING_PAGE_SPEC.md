# Reading Page Spec

## Role

- `mobile/pages/detail/index.vue` 是唯一阅读页。
- 所有文章入口统一跳到该页面。

## Entry Rules

- 首页文章点击默认进入 `quick_30s`。
- 搜索、我的、消息摘要中的文章点击也默认进入 `quick_30s`。
- 同页顶部切换到 `deep_3m`，不新开页面。

## Required Behaviors

- `quick_30s` 为完整纵向滚动正文。
- `deep_3m` 为完整纵向滚动正文。
- 禁止缩略、省略号、查看更多、折叠、分页、轮播、步骤卡。
- teen/general/adult 继续通过既有 audience 参数请求。
- detail cache key 继续保持 `article_id + audience_mode + reading_mode` 作用域。

## State Behaviors

- `loading`: 阅读内容准备中
- `error`: 系统/adapter 获取失败
- `unavailable`: 业务安全边界下没有可展示版本
- `cached`: 命中同作用域缓存版本

## Allowed Secondary Actions

- 保存到稍后再读 / 取消保存
- 打开订阅页查看权益说明

## Explicit Non-Goals

- 不引入阅读倒计时
- 不引入阅读进度条
- 不引入挑战/任务感 CTA
- 不引入社交互动模块
