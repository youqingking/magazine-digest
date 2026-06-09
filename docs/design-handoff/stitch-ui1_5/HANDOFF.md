# Stitch UI1.5 Handoff

## Purpose

- Keep the latest Stitch export in a stable, source-controlled handoff location.
- Give runtime audit and UI sync work a persistent design input path.

## Source Provenance

- Current handoff root: `docs/design-handoff/stitch-ui1_5/`
- Latest refresh date: `2026-03-20`
- Latest refresh source: user-updated Stitch export copied into this directory

## Included Assets

- `DESIGN.md`
- `screen.html`
- `screen.png`
- `screen-1.png` to `screen-5.png`
- `screen-1.html` to `screen-5.html`

## Canonical File Rule

- Use the flat files in this directory root as canonical handoff files.
- Treat `screen.html` and `screen.png` as the latest homepage handoff.
- Ignore old numeric source folders such as `_1` to `_5` if they are still present locally after a copy.
- Future refreshes should overwrite the flat root files directly.

## Intended Use

- Use this directory as the stable local reference for UI audit, IA comparison, and future design-close implementation prep.
- Treat these files as the current workspace handoff baseline unless replaced by a newer official export.

## Runtime UI Close Notes

- Feed 来源栏必须支持多刊扩展，不允许通过压窄 pill 宽度或多行挤压来容纳更多刊物。
- 多刊状态下应采用单行横向浏览入口，长刊名允许截断，排序优先服从用户当前阅读/更新信号。
- Detail 阅读页优先保证正文可读性：左右留白应尽量克制，deep / quick 两档正文都应保持舒适字号和行高，不把正文做成偏小的卡片字。
- Feed / Search 的文章列表都必须按 `article_id` 去重，不允许同一篇因跨 section 或聚合重复而在当前屏幕重复出现。
- Search 必须存在明确可点的触发入口，不能只依赖软键盘 confirm 作为唯一搜索动作。
- Search 必须结果优先，默认只展示最关键的来源筛选；大量 tag / 栏目 / 主题桶应收进“更多筛选”，不能在首屏把结果整体顶到下方。
- Search 点击后必须有立即可见的状态反馈，例如 loading / 已更新结果，不能让用户感知成“按钮没生效”。
- Search 按钮本身也必须有即时按压反馈，不能只有按钮外的提示文案变化。
- Feed 顶部“消息摘要”必须反映真实未读状态；用户进入消息摘要后，应消费当前未读，不允许长期显示过期未读数。
- “关注更新”必须是用户显式关注后的结果，不允许把全部刊物默认视为已关注；来源页承担关注管理入口，关注后首页关注流与更新消息都只显示已关注刊物。
- audience 偏好必须是全局持久化的；用户切到青少年后，首页 / 搜索 / 详情里的 30 秒摘要都应优先命中青少年版本，而不是只在详情页局部生效。
- 流内摘要卡本身已可点击进入详情，首页 / 搜索里不再重复展示“点击进入 3 分钟精读”类 CTA。
- detail 仍是唯一阅读页，但应只保留 3 分钟精读主阅读，不再在详情页重复展示 30 秒摘要切换。
- 内部发布版默认关闭开发态 sentinel、Feed 诊断、运行来源与构建调试块；只有显式打开 `VUE_APP_DEV_VISIBILITY=true` 时才显示。
- 30 秒摘要属于流内主内容，不应使用偏小字号；正文需要保持接近正常阅读的舒适尺寸。
- 正式阅读流应尽量去掉说明书式小字和重复元信息：标题下不重复堆同义副标题，首页 / 搜索不保留运行提示或设计解释型微文案，只保留真正帮助阅读和选择的信息。

## Remaining Boundary

- This handoff is now stable and reviewable inside the repo.
- The user has confirmed this directory now contains the latest files and should be treated as the active local design baseline.
- If product/design ships a newer export later, it should replace these root files in-place.
