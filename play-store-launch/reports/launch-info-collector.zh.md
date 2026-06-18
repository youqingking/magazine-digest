# launch-info-collector 上架信息收集报告

生成时间：`2026-06-18T09:52:59Z`

## 总状态
- overall_status: `blocked`
- proof_mode: `parsed_repo_evidence`
- 输出目录：`play-store-launch/reports`

## Launch 信息矩阵
| 字段 | 状态 | 当前值/候选 | 证据 | 人类需要做什么 |
| --- | --- | --- | --- | --- |
| App 名称 | `observed` | Magazine Digest | ev_0009, ev_0010, ev_0011, ev_0012, ev_0013, ev_0014, ev_0015 | - |
| 一句话定位 | `observed` | 为重度阅读者整理杂志长文摘要、续读进度和收藏内容的移动阅读工具 | ev_0016 | - |
| 核心功能 | `observed` | 聚合杂志文章与出版物内容，支持发现和搜索；提供文章摘要、详情页和继续阅读记录；支持关注、收藏和稍后阅读等个人阅读管理；提供订阅权益、付费计划和会员状态展示；通过通知收件箱和偏好设置管理内容提醒 | ev_0017 | - |
| 目标用户 | `observed` | 重度杂志与长文读者；希望快速筛选和继续阅读内容的移动端用户；需要管理关注、收藏和阅读记录的内容消费者 | ev_0018 | - |
| 支持平台 | `inferred` | Android(observed)；iOS(inferred)；Web/H5(observed)；React Native/Expo(observed)；uni-app(observed) | ev_0019, ev_0020, ev_0021, ev_0022, ev_0023 | 确认哪些平台属于本次上架/发布范围，尤其是仅由框架能力推断的平台。 |
| 隐私相关 | `inferred` | {"data_categories": ["账号/个人资料", "设备/推送标识", "内容行为/阅读状态", "订阅/支付/权益", "活动/分析事件"], "third_party_sdk_candidates": ["expo", "uni_app"], "android_permiss... | ev_0024, ev_0025, ev_0026, ev_0027, ev_0028, ev_0029, ev_0030 | 补充并确认：实际收集的数据、是否关联身份、是否追踪、是否共享、第三方 SDK 用途、隐私政策 URL。 |
| 账号系统 | `needs_human` | {"account_signals_found": true, "must_login": "NEED_HUMAN"} | ev_0031 | 说明是否必须登录、哪些功能可游客使用、是否提供账号删除/注销入口。 |
| 订阅/内购 | `inferred` | {"monetization_signals_found": true, "has_iap_or_subscription": "LIKELY_YES"} | ev_0032 | 确认是否有 IAP、订阅、试用、价格、支付渠道，以及 Google Play Billing 合规路径。 |
| 支持方式 | `missing` | NEED_HUMAN | - | 提供可公开的 support URL、support email 或 FAQ/help center。 |
| 截图 demo 数据 | `observed` | {"policy": "截图必须来自真实 app UI；可使用种子文章、出版物、关注与收藏数据，但不能展示尚未实现的功能。", "exampleSources": ["mobile/fixtures/runtime", "backend/adapters/fixture-repository.... | ev_0033 | - |

## App 名称候选
- 产品名候选：Magazine Digest
- 备用/技术名候选：高效阅读, com.daowei2026.magazinedigest, magazine-digest, __UNI__005A993

## 证据摘要
- `ev_0001` `launch_json` from `play-store-launch/inputs/launch-info.json`：["alternateNames", "appName", "coreFeatures", "ownerReviewRequired", "positioning", "schema_version", "screenshotDemoData", "status", "supportedPlatforms", "targetUsers"]
- `ev_0002` `app_name` from `play-store-launch/inputs/launch-info.json`：Magazine Digest
- `ev_0003` `alternate_names` from `play-store-launch/inputs/launch-info.json`：["高效阅读"]
- `ev_0004` `positioning` from `play-store-launch/inputs/launch-info.json`：为重度阅读者整理杂志长文摘要、续读进度和收藏内容的移动阅读工具
- `ev_0005` `core_features` from `play-store-launch/inputs/launch-info.json`：["聚合杂志文章与出版物内容，支持发现和搜索", "提供文章摘要、详情页和继续阅读记录", "支持关注、收藏和稍后阅读等个人阅读管理", "提供订阅权益、付费计划和会员状态展示", "通过通知收件箱和偏好设置管理内容提醒"]
- `ev_0006` `target_users` from `play-store-launch/inputs/launch-info.json`：["重度杂志与长文读者", "希望快速筛选和继续阅读内容的移动端用户", "需要管理关注、收藏和阅读记录的内容消费者"]
- `ev_0007` `supported_platforms` from `play-store-launch/inputs/launch-info.json`：["Android"]
- `ev_0008` `screenshot_demo_data` from `play-store-launch/inputs/launch-info.json`：{"policy": "截图必须来自真实 app UI；可使用种子文章、出版物、关注与收藏数据，但不能展示尚未实现的功能。", "exampleSources": ["mobile/fixtures/runtime", "backend/adapters/fixture-repository.mjs"]}
- `ev_0009` `app_name` from `launch-info-json`：Magazine Digest
- `ev_0010` `app_name` from `app.json`：Magazine Digest
- `ev_0011` `app_identifier` from `app.json`：com.daowei2026.magazinedigest
- `ev_0012` `app_identifier` from `package.json`：magazine-digest
- `ev_0013` `alternate_names` from `package.json`：magazine-digest
- `ev_0014` `app_name` from `mobile/manifest.json`：高效阅读
- `ev_0015` `app_identifier` from `mobile/manifest.json`：__UNI__005A993
- `ev_0016` `positioning` from `launch-info-json`：为重度阅读者整理杂志长文摘要、续读进度和收藏内容的移动阅读工具
- `ev_0017` `core_features` from `launch-info-json`：["聚合杂志文章与出版物内容，支持发现和搜索", "提供文章摘要、详情页和继续阅读记录", "支持关注、收藏和稍后阅读等个人阅读管理", "提供订阅权益、付费计划和会员状态展示", "通过通知收件箱和偏好设置管理内容提醒"]
- `ev_0018` `target_users` from `launch-info-json`：["重度杂志与长文读者", "希望快速筛选和继续阅读内容的移动端用户", "需要管理关注、收藏和阅读记录的内容消费者"]
- 另有 15 条证据见 JSONL。

## 阻塞项
- `账号系统` status=`needs_human`：发现账号/登录能力信号，但没有证明 app 是否必须登录。 解除方式：说明是否必须登录、哪些功能可游客使用、是否提供账号删除/注销入口。
- `支持方式` status=`missing`：未发现 support URL、email 或 FAQ。 解除方式：提供可公开的 support URL、support email 或 FAQ/help center。

## 总结
- 当前 launch-info-collector 总状态：`blocked`。
- 不能交给下游作为完整 source-of-truth：还有 2 个字段缺失、冲突或必须人工确认。
- 优先处理：账号系统：说明是否必须登录、哪些功能可游客使用、是否提供账号删除/注销入口；支持方式：提供可公开的 support URL、support email 或 FAQ/help center。
- 推断字段需要人工复核：supported_platforms, privacy, subscription_iap。
- 已有明确证据字段：app_name, positioning, core_features, target_users, screenshot_demo_data。
- 本报告只收集和归类 launch 信息，不执行任何发布动作。
