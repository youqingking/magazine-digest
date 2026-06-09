# Stack Decision

## Decision

- 前端主壳冻结为 `Expo + React Native + TypeScript + Expo Router + EAS`。
- 后端冻结为 `Supabase`。
- 订阅冻结为 `RevenueCat`。
- 推送冻结为 `expo-notifications / Expo Push`，并预留未来直连 `FCM/APNs` 的 seam。
- 现有 `DCloud / uni-app / HBuilderX / uniCloud` 代码不再作为未来主壳，只作为 migration reference。

## Why Expo-first

- Expo 生态更贴近未来 React Native 主流能力，后续招聘、模板复用、社区支持和 SDK 升级路径更稳。
- `Expo Router` 能把现有 `pages/feed`、`paywall`、`profile` 等导航语义平移成明确的文件路由，而不是继续绑定 `pages.json`。
- `EAS` 能给 Android-first 的 dev build、内部测试、签名与分发留出标准路径，减少对 `HBuilderX` 的工具耦合。
- `expo-notifications`、`expo-updates`、`expo-secure-store` 等官方模块更适合沉淀长期可维护的 seam。
- 对未来接入 `Supabase`、`RevenueCat`、`Sentry`、CI/CD 的兼容性更直接，不需要继续围绕 uni-app 适配层折返。

## Why DCloud Stays Reference-only

- 当前 `mobile/` 明确依赖 `App.vue`、`main.js`、`pages.json`、`manifest.json`、`uni_modules/`、`uniCloud-aliyun/`，这是 DCloud-only 主壳结构。
- `HBuilderX` 与 `uniCloud` 的脚本、云对象和生成目录把构建链路、部署方式和运行时能力绑定在旧栈上。
- 这些代码仍然保留产品语义、页面命名、交互边界和部分契约，但不再代表未来工程主线。
- 因此本仓库的迁移策略不是“继续修旧壳”，而是“保留 reference，重建 Expo-first shell，并迁移共享语义”。

## Future Source Of Truth

以下语义继续作为未来实现的 source of truth，并将逐步沉淀到 `packages/core-*` 与 `infra/supabase`：

### `product / product_key`

- `product_key` 仍是多产品、多环境、多配置域的主维度。
- 所有合同、事件、计划、权益、内容与通知模型都必须带 `product_key`。

### `articles / article_variants`

- `articles` 与 `article_variants` 继续作为内容与变体语义中心。
- 未来只接收外部流水线产出的标准化内容，不在 App 仓库内生产内容。

### `user profiles / entitlements`

- 用户档案、安装实例、权限快照、内容状态、关注关系与权益快照继续保留为核心用户语义。
- 实现层会从 `uniCloud` 迁移到 `Supabase`，但语义边界不变。

### `pricing / plans / experiments`

- 定价、套餐、优惠、实验、特性开关继续保留为动态配置层。
- 价格与实验参数不得硬编码到客户端。

### `event logging`

- 事件采集、去重、指标聚合仍是核心观测层。
- 后续只重做 sink 与接线，不重做事件命名原则与 `product_key` 约束。
