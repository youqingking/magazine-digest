---
name: google-data-safety-agent
description: 准备 Google Play Data safety 相关材料，并生成证据绑定的数据安全草稿、数据类型矩阵和人工阻塞报告。适用于需要根据 app permissions、SDK list、analytics events、backend API/logs、account system、payment provider、crash reporting、ad SDK 等证据整理 Data safety 输入的 Android、Expo、Flutter、React Native、Capacitor、uni-app 或 Web-backed mobile 项目。
---

# google-data-safety-agent

## 目标

准备 Google Play Data safety 相关材料。该 skill 只做证据收集、表单草稿整理和人工确认项说明；不读取凭据，不连接第三方服务，不上传素材，不执行发布动作。

## 收集范围

只围绕 Data safety 需要的人类可审信息输出：

- app permissions：Android 权限、平台权限、能力声明。
- SDK list：analytics、ads、crash reporting、push、auth、payment、cloud、social login 等 SDK/服务候选。
- analytics events：埋点、事件、指标、实验、行为日志。
- backend API/logs：API、schema、日志、数据表、队列、事件流。
- account system：登录、注册、账号资料、账号删除/注销。
- payment provider：订阅、内购、支付订单、权益、支付 SDK。
- crash reporting：崩溃、诊断、错误日志、性能诊断。
- ad SDK：广告 SDK、广告标识、营销/追踪信号。

## 运行方式

在 App 项目根目录运行：

```powershell
python .codex/skills/google-data-safety-agent/scripts/validate.py .
```

如项目有额外证据 JSON，可显式传入：

```powershell
python .codex/skills/google-data-safety-agent/scripts/prepare_data_safety.py --root . --evidence-json path\to\evidence.json
```

输出文件固定在：

- `play-store-launch/reports/google-data-safety-agent.zh.md`
- `play-store-launch/reports/google-data-safety-agent-output.json`
- `play-store-launch/reports/google-data-safety-source-of-truth.json`
- `play-store-launch/reports/google-data-safety-evidence.jsonl`
- `play-store-launch/reports/google-data-safety-form-draft.csv`

## 证据规则

- 优先解析结构化文件和源码：manifest、package、schema、API、日志、事件、权限、SDK 依赖、配置文件。
- 每个 Data safety 草稿答案必须绑定证据；没有证据时只能标记为 `NEED_HUMAN` 或 `NO_NOT_OBSERVED`，不能写成最终否定结论。
- `shared`、`tracking`、`linked_to_identity`、`required_or_optional`、`encrypted_in_transit`、`deletion_request` 等字段必须保守处理，静态证据不足时标记为 `NEED_HUMAN`。
- 发现账号、支付、广告、推送、analytics、crash reporting 或第三方 SDK 时，必须列入人工确认项。
- 尊重 `.gitignore`；不要把忽略的依赖、构建产物或第三方插件内部文档当作 App 自身事实。

## Skill 内资源

- `scripts/prepare_data_safety.py`：收集证据并生成 Data safety 草稿。
- `scripts/validate.py`：面向项目根目录的运行入口。

## 报告要求

报告必须聚焦 Data safety：

- 展示全局问题草稿：是否收集/共享用户数据、是否加密传输、是否支持删除请求、隐私政策 URL、第三方 SDK/共享、tracking、儿童/敏感数据风险。
- 展示逐数据类型矩阵：数据类别、数据类型、collected、shared、用途、身份关联、tracking、证据和人工动作。
- 展示 SDK、权限、analytics、backend/API/log、账号、支付、crash、ads 的证据摘要。
- 明确说明为什么 blocked，以及人类需要补充或确认什么。
- 不加入与 Data safety 准备无关的内容。
