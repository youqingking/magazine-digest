# screenshot-storyboard Boundary Reference

本 skill 只负责截图规划，不负责真实截图、最终视觉设计、Play Console 提交或 UI 修改。

## Skill-owned responsibility

- 解析真实 app 页面、route、fixture、listing claim、release/capture/privacy 上游状态。
- 生成每个 shot 的 `screen / route / scenario / claim / evidence / copy / must_not_show`。
- 生成 `screenshot-shot-list.json` 与 `screenshot-capture-handoff.json`，供 `screenshot-capture-agent` 显式消费。
- 将公开使用、合规、商标、内容授权、裁切、安全区、设备类型和最终素材选择标记为 `NEED_HUMAN`。

## Not owned

- 不捕获 Android screenshot。
- 不生成最终 Google Play 图片素材。
- 不修改 app 源码、UI、fixture、远端配置、账号状态或支付状态。
- 不提交 Play Console。
- 不声称截图可上架、可提交、最终合规或已经获得 Google 审批。
- 不依赖 Agno workflow、其他 agent skill、`play-store-launch/shared` 或 `play-store-launch/validators`。

## Evidence boundary

允许读取项目事实：

- `mobile/pages.json`
- `mobile/manifest.json`
- `app.json`
- `README.md`
- `mobile/pages/**/*.vue`
- `mobile/fixtures/runtime/current/*.json`
- `play-store-launch/reports/*-output.json`

`play-store-launch/reports` 是默认输出目录，不是共享运行时依赖。

## Relationship with capture

`screenshot-storyboard` 输出 shot-list；`screenshot-capture-agent` 后续根据 shot-list 从真实 app 捕获 raw screenshot。capture 的结果只能作为“是否已经真实捕获”的状态参考，不能反向生成或补全 storyboard claim。
