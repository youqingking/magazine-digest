# Stage UI1 Decisions

## Scope Lock

- Stage UI1 只做 IA 收敛、唯一阅读页整合、返回链路状态保留、视觉语言收口。
- Stage B canonical contracts 继续保持不变。
- 不改 schema / backend contracts / payment semantics。
- 不接真实支付 provider、webhook、entitlement 激活。

## Visual Reference vs Structural Truth

- 视觉参考：
  - 延续 Stage E2 的 token、typography、state panel 节奏。
  - 吸收 editorial / digital curator 气质。
  - 更强色块层次、更弱边框感、更大阅读留白、更克制 CTA。
- 结构真相：
  - 首页、详情、搜索、订阅、邀请/兑换、我的、设置是唯一正式页面职责。
  - 详情页是唯一阅读页。
  - 30 秒速览和 3 分钟精读共用同一页顶部切换。

## Adopted Design Language

- 采纳了暖灰底色与米色分层，替代线框式页面分隔。
- 采纳了更强标题层级和更安静的按钮语言。
- 采纳了首页 hero + section 的 editorial 结构，但不照搬截图导航数量。
- 采纳了阅读正文更长留白、更弱装饰线的方向。

## Explicitly Not Adopted

- 没采纳截图式独立 inbox / follows / campaign 一级导航。
- 没采纳模式大卡、任务感文案、进度条、倒计时、挑战式阅读提示。
- 没采纳社交热度、点赞、评论、头像人数等噪音元素。
- 没采纳任何未确认商业文案，例如“包季”“AI 对话助手”“10000 字处理容量”。

## IA Merge Decisions

- inbox 归位到首页消息摘要与我的页摘要信息，不再单独作为一级页面。
- follows 归位到搜索页关注目录与首页关注更新，不再单独作为一级页面。
- campaign 归位到订阅页 offer/context 区块，不再单独作为一级页面。
- 旧 route 仅保留轻量 alias/redirect，不保留长期双重 IA。

## Reading Decisions

- 点击首页文章默认进入 `quick_30s`。
- `quick_30s` 和 `deep_3m` 都呈现完整纵向滚动正文，不做缩略、省略、分页、折叠、轮播。
- teen/general/adult 安全边界继续复用既有 detail 请求与缓存隔离策略。
- unavailable / cached / error 继续保留，但表达改成阅读型状态块而不是 debug block。
