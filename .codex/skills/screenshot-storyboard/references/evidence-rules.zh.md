# Screenshot Storyboard Evidence Rules

## Claim class

- `C0`：扫描范围、工具和输入来源。
- `C1`：直接来自项目文件、JSON、源码或已有报告的事实。
- `C2`：由多个事实组合得到的规划判断。
- `C3`：公开上架表达、截图可用性、设计包装判断，必须人工确认。
- `C4`：Google Play 规格、metadata、商标、内容授权、目标受众、订阅/支付风险，必须人工确认。
- `C5`：阻塞项，必须人工处理。

## Status

- `planned`：已经生成规划，但未捕获 raw screenshot。
- `blocked`：缺少 route、claim、fixture、release/capture 证据，或不能继续证明。
- `needs_human`：需要人工确认后才能公开使用。
- `observed_in_repo`：项目文件或已有报告中直接观察到。
- `inferred`：由多个证据推断，不能作为最终合规结论。

## Human review

以下永远标记 `human_review_required=true` 与 `review_status=NEED_HUMAN`：

- 公开用于 Google Play 的截图。
- 设计包装、标题、背景、裁切、安全区。
- 第三方品牌、出版物、文章内容、商标或版权。
- 订阅、支付、兑换、奖励、账号、设备信息、通知权限。
- 目标年龄、内容分级、隐私、Data safety。

## Must not show

每个 shot 必须带 `must_not_show`。至少包含：

- 不存在的功能或尚未证明的能力。
- Debug、开发态、诊断、构建、远端桥接、内部兼容页面。
- 真实个人数据、真实账号、真实手机号、支付凭据、密钥。
- 排名、评分、下载量、价格促销、限时优惠、Play Store 表现暗示。
