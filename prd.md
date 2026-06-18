# 八个 Agent 的工业级 MVP 要求

## 1）`release-build-agent`
作用：Play Store 发布前，先证明 app 能 build、typecheck、smoke、preflight，不能只准备文案

## 2）`privacy-disclosure-prep`
作用：从代码、SDK、埋点、权限、后端日志推断需要披露的数据收集情况
它应该检查：
- 使用了哪些 SDK
- 收集哪些用户数据
- 是否关联身份
- 是否用于追踪
- 是否与第三方共享
- 是否有账号删除流程
- 是否有隐私政策 URL
- 是否有儿童/敏感数据风险


## 3）`google-play-listing`

作用： 准备 Google Play 主商店 listing。

Google Play 的 preview assets 包括 feature graphic、screenshots、short description、videos 等，用来展示功能和吸引用户；Google Play 还要求发布 store listing 时提供 app icon，并规定 icon 是 512px × 512px、32-bit PNG、最大 1024KB，short description 限制为 80 字符。

Google Play metadata 政策还要求 app title 不超过 30 个字符，并禁止误导性、无关、过度格式化、不合适的 metadata。

Google Play 的商店 listing 最佳实践明确提醒，不要在文本或图片里使用表示商店表现、排名、价格或促销的信息；截图可以使用 tagline，但应尽量少用文字

## 4）`screenshot-storyboard`
作用： 负责把每个截图 shot 绑定到真实 screen / route / scenario / claim,设计每张上架图讲什么故事,只写镜头、页面、文案，不改 UI；capture 从真实 app 捕获 raw screenshots；design 加背景和标题但不能虚构功能

## 5）`screenshot-capture-agent`
作用： 负责真实截图捕获,截图必须来自真实 app UI，demo 数据可以美化但不能展示不存在功能；每张截图要有来源页面、设备、locale、commit hash。

## 6）`launch-info-collector`
作用： 收集 App 名称、定位、核心功能、目标用户、支持平台、隐私、账号系统、订阅、支持方式、截图 demo 数据等。

负责收集：
| 信息           | 示例                    |
| ------------ | --------------------- |
| App 名称       | 产品名、备用名               |
| 一句话定位        | 给谁、解决什么问题             |
| 核心功能         | 3-5 个主卖点              |
| 目标用户         | 学生、创作者、独立开发者、家庭用户     |
| 支持平台         | iOS、Android、Web       |
| 隐私相关         | 收集哪些数据、是否第三方 SDK      |
| 账号系统         | 是否必须登录                |
| 订阅/内购        | 是否有 IAP、订阅、试用         |
| 支持方式         | support URL、email、FAQ |
| 截图所需 demo 数据 | 示例用户、示例项目、示例结果        |

## 7）`google-data-safety-agent`
作用： 准备 Google Play Data safety 相关材料。

证据来源：
- app permissions
- SDK list
- analytics events
- backend API logs
- account system
- payment provider
- crash reporting
- ad SDK

---

## 8）`launch-package-agent`

作用： 把前面所有上架材料打包，中文为主，人类可读