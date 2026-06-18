---
name: launch-info-collector
description: 收集 App 上架前的 launch source-of-truth，并生成证据绑定的缺失项与人工阻塞报告。适用于需要整理 App 名称、定位、核心功能、目标用户、支持平台、隐私、账号系统、订阅/内购、支持方式、截图 demo 数据的 Android、Expo、Flutter、React Native、Capacitor、uni-app 或 Web-backed mobile 项目。
---

# launch-info-collector

## 目标

收集 App 上架前必须明确的信息，并把每个字段绑定到真实项目证据。该 skill 只做信息收集、证据归类和缺口说明；不创建商店应用，不读取凭据，不上传素材，不执行发布动作。

## 收集范围

只围绕以下信息输出：

- App 名称：产品名、备用名、manifest/package 中的候选名冲突。
- 一句话定位：给谁、解决什么问题。
- 核心功能：3-5 个主卖点；优先使用明确文档，其次用真实 route、screen、schema、API 信号推断。
- 目标用户：学生、创作者、独立开发者、家庭用户等明确用户段。
- 支持平台：iOS、Android、Web 等，并说明证据来源。
- 隐私相关：可能收集的数据类型、第三方 SDK/服务信号、仍需人工确认的隐私事实。
- 账号系统：是否存在账号、登录、注销信号；是否必须登录必须有证据，没有证据时标为 `NEED_HUMAN`。
- 订阅/内购：是否存在 IAP、订阅、试用、支付、权益信号；没有证据时标为 `NEED_HUMAN`。
- 支持方式：support URL、email、FAQ 或 help center。
- 截图所需 demo 数据：示例用户、示例项目、示例结果、fixture、seed、mock、scenario 来源。

## 运行方式

在 App 项目根目录运行：

```powershell
python .codex/skills/launch-info-collector/scripts/validate.py .
```

如项目已有独立 launch-info JSON，可显式传入：

```powershell
python .codex/skills/launch-info-collector/scripts/collect_launch_info.py --root . --source-json path\to\launch-info.json
```

输出文件固定在：

- `play-store-launch/reports/launch-info-collector.zh.md`
- `play-store-launch/reports/launch-info-collector-output.json`
- `play-store-launch/reports/launch-info-source-of-truth.json`
- `play-store-launch/reports/launch-info-evidence.jsonl`

## 证据规则

- 优先解析结构化文件：`app.json`、`app.config.json`、`package.json`、`manifest.json`、Android/iOS manifest、`pubspec.yaml`、Capacitor config、Fastlane metadata 或显式 launch-info JSON。
- 文本文档只用于明确标注的产品信息段落，例如定位、功能、目标用户、支持方式、隐私、账号、订阅、截图 demo 数据。
- 尊重 `.gitignore`；不要把忽略的依赖、构建产物或第三方插件内部文档当作 App 自身事实。
- 每个字段必须标记为 `observed`、`inferred`、`conflict`、`missing` 或 `needs_human`。
- 没有证据只能说明缺失，不能反向证明没有功能、没有 SDK、没有账号要求、没有订阅或没有数据收集。

## Skill 内资源

- `scripts/collect_launch_info.py`：收集证据并写出报告。
- `scripts/validate.py`：面向项目根目录的运行入口。

## 报告要求

报告必须聚焦上架信息本身：

- 用字段矩阵展示当前值/候选、状态、证据编号和人类需要补充的信息。
- 对冲突、缺失和必须人工确认的字段说明原因。
- 在最后给出总状态，说明当前信息是否足够作为下游 listing、截图规划和 data safety 准备的输入。
- 不加入与上架信息收集无关的内容。
