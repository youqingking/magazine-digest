# screenshot-storyboard 截图规划报告

- 生成时间：`2026-06-18T10:36:12Z`
- 总状态：`blocked`
- Storyboard 状态：`planned`
- 结论：这是截图规划和 capture handoff，不是最终 Google Play 上架素材。

## App 与证据来源

- App 名称：`高效阅读`
- Android package：`com.daowei2026.magazinedigest`
- 路由来源：`mobile/pages.json`，共 `27` 个页面。
- Runtime fixture：`observed_in_repo`；文章候选 `63`；implemented surfaces `24` 个。

## Primary Shots

| shot | route | story | claim | review |
| --- | --- | --- | --- | --- |
| `shot_01_home_feed` | `pages/feed/index` | 证明用户可以先浏览中文文章摘要，再选择进入精读。 | 浏览中文文章摘要和详情页。 | `NEED_HUMAN` |
| `shot_02_detail_deep_read` | `pages/detail/index` | 证明 app 存在文章详情与 3 分钟精读体验。 | 浏览中文文章摘要和详情页。 | `NEED_HUMAN` |
| `shot_03_sources_follow` | `pages/search/index` | 证明用户可以查看来源更新并关注感兴趣的来源。 | 查看来源更新并关注感兴趣的来源。 | `NEED_HUMAN` |
| `shot_04_profile_summary` | `pages/profile/index` | 证明 app 有阅读状态汇总入口，但公开使用需避开账号隐私。 | 使用消息摘要、个人页和设置入口管理阅读状态。 | `NEED_HUMAN` |

## 每张图的文案与禁止项

### `shot_01_home_feed` 首页
- Route：`pages/feed/index`
- Scenario：打开 app 首页，展示内容流、30 秒先读摘要和消息摘要入口。
- 标题草稿：先看摘要，再决定是否精读
- 副标题草稿：首页聚合文章更新与 30 秒先读。
- 可见证据：首页/效率阅读入口；文章标题或摘要卡片；30 秒先读；消息摘要入口
- 禁止展示：不存在或未证明的功能；排名、评分、下载量、价格促销、限时优惠或 Play Store 表现暗示；真实个人隐私、手机号、邮箱、支付凭据、密钥或后台 token；系统 Launcher、HBuilderX 空壳、错误页、崩溃页或非目标 app 页面；Feed 诊断信息；debug/diagnostic 信息；开发态或诊断信息；未经授权确认的第三方出版物名称、文章标题或品牌露出
- 人工确认：`NEED_HUMAN`

### `shot_02_detail_deep_read` 3分钟精读
- Route：`pages/detail/index`
- Route params：`{"articleId": "art_barrons_09022026_004", "readingMode": "deep_3m", "source": "storyboard"}`
- Scenario：进入文章详情页，展示 3 分钟精读、阅读操作和权益提示。 示例 articleId=art_barrons_09022026_004。
- 标题草稿：把长文压缩成可读精华
- 副标题草稿：详情页展示 3 分钟精读内容。
- 可见证据：3 分钟精读标题；文章标题；摘要/精读正文；阅读操作；示例文章来自 runtime fixture
- 禁止展示：不存在或未证明的功能；排名、评分、下载量、价格促销、限时优惠或 Play Store 表现暗示；真实个人隐私、手机号、邮箱、支付凭据、密钥或后台 token；系统 Launcher、HBuilderX 空壳、错误页、崩溃页或非目标 app 页面；支付信息；订阅/支付权益；未经授权确认的第三方出版物名称、文章标题或品牌露出
- 人工确认：`NEED_HUMAN`

### `shot_03_sources_follow` 来源
- Route：`pages/search/index`
- Route params：`{"focus": "follows"}`
- Scenario：打开来源页，展示搜索、来源结果和关注杂志入口。
- 标题草稿：按来源发现更新
- 副标题草稿：搜索文章、期次和关注的杂志来源。
- 可见证据：搜索文章、来源、期次、主题；关注杂志；来源结果；阅读深度筛选
- 禁止展示：不存在或未证明的功能；排名、评分、下载量、价格促销、限时优惠或 Play Store 表现暗示；真实个人隐私、手机号、邮箱、支付凭据、密钥或后台 token；系统 Launcher、HBuilderX 空壳、错误页、崩溃页或非目标 app 页面；未经授权确认的第三方出版物名称、文章标题或品牌露出
- 人工确认：`NEED_HUMAN`

### `shot_04_profile_summary` 我的
- Route：`pages/profile/index`
- Scenario：打开我的页面，展示未读消息、稍后再读、权益和设置入口。
- 标题草稿：集中管理阅读状态
- 副标题草稿：消息、保存和权益入口汇总在个人页。
- 可见证据：阅读权益；未读消息；消息摘要；稍后再读；打开设置
- 禁止展示：不存在或未证明的功能；排名、评分、下载量、价格促销、限时优惠或 Play Store 表现暗示；真实个人隐私、手机号、邮箱、支付凭据、密钥或后台 token；系统 Launcher、HBuilderX 空壳、错误页、崩溃页或非目标 app 页面；订阅/支付权益；未经授权确认的第三方出版物名称、文章标题或品牌露出
- 人工确认：`NEED_HUMAN`

## 暂缓进入 Capture 的页面

- `pages/settings/index`：设置页含远端桥接、设备、本地调试和构建信息；公开截图前必须确认生产构建隐藏开发态内容。 (`NEED_HUMAN`)
- `pages/paywall/index`：订阅/套餐/额度属于商业和支付相关表达；需产品、法务和 Play policy 人工确认。 (`NEED_HUMAN`)
- `pages/invite/index`：兑换码、奖励和邀请属于增长/奖励表达；不能展示未证明的奖励结算。 (`NEED_HUMAN`)
- `pages/inbox/index`：源码标记为 internal 能力页，正式入口在首页消息摘要；不作为默认公开截图。 (`NEED_HUMAN`)
- `pages/follows/index`：源码标记为 alias route，会跳转到搜索页；使用 search route 作为正式截图。 (`NEED_HUMAN`)
- `pages/campaign/index`：源码标记为 alias/internal campaign route，会跳转到订阅页商业区块。 (`NEED_HUMAN`)

## Capture Handoff

- Shot-list：`play-store-launch/reports/screenshot-shot-list.json`
- 推荐命令：`python .codex/skills/screenshot-capture-agent/scripts/screenshot_capture.py --root . --shot-list play-store-launch/reports/screenshot-shot-list.json`
- 说明：capture 必须从真实 Android app 前台通过 adb 获取 raw PNG；storyboard 不能替代截图证据。

## NEED_HUMAN

- `human.screenshot.public_use`：所有公开用于 Google Play 的截图、标题、背景、裁切和安全区都必须人工审核。
- `human.screenshot.google_play_specs`：Storyboard 无法证明最终图片尺寸、格式、alpha、设备类型和 Play Console 分类，需要在 raw screenshot/design 阶段人工确认。
- `human.screenshot.trademark_content_authorization`：runtime fixture 中存在第三方出版物或文章内容，公开截图使用前需要授权/商标/内容合规确认。
- `human.screenshot.capture_execution`：storyboard 只生成 shot-list；必须由 screenshot-capture-agent 从真实 app 前台捕获 raw screenshot。
- `human.held_shots`：部分页面涉及内部、开发、订阅、兑换或 alias 风险，默认不进入 capture shot-list。

## Blockers

- `raw_screenshots_not_captured`：尚未通过 screenshot-capture-agent 证明真实 raw screenshots。 解除方式：使用生成的 screenshot-shot-list.json 重跑 screenshot-capture-agent，并确保目标 app 在前台。
- `privacy_or_target_audience_needs_human`：隐私、Data safety、目标年龄或敏感内容仍有人工确认项，公开截图文案需同步确认。 解除方式：完成 privacy/data safety/target audience 人工审核后再批准公开截图。

## 官方规格摘要

- 至少 `2` 张截图；每设备类型最多 `8` 张。
- 格式：JPEG, 24-bit PNG without alpha；尺寸 `320` 到 `3840` px。
- 官方来源：https://support.google.com/googleplay/android-developer/answer/9866151?hl=en
