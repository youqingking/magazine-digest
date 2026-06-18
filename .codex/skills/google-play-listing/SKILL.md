---
name: google-play-listing
description: 准备 Google Play 主商店 listing 草稿。Use when Codex needs app title, short description, full description, preview asset checks, metadata policy guardrails, and human blockers for Google Play main store listing across Android, Expo, Flutter, React Native, Capacitor, uni-app, or Fastlane metadata projects.
---

# google-play-listing

## 概览

这个 skill 用来准备 Google Play 主商店 listing 草稿。它只回答一个问题：当前 app 项目是否已经具备可用于 Google Play 主商店 listing 的文案和 preview assets 证据。

核心原则：

- 只处理 Google Play 主商店 listing：app title、short description、full description、app icon、feature graphic、screenshots、video、metadata policy 风险和人工阻塞项。
- 适用于不同 app 项目；不要依赖某个仓库的私有需求文档、运行样本、历史报告、编排产物或固定目录。
- 优先读取通用输入：Google Play listing JSON、Fastlane metadata、Android/Expo/Flutter/Capacitor/uni-app manifest、常见 store asset 目录。
- 不调用 Google Play API，不打开 Play Console，不提交、不上传、不发布。
- 不虚构未实现功能；缺文案、缺素材或缺人工字段时必须 `blocked`。
- 不在 metadata 中使用表示商店表现、排名、价格、促销、审核结果或过度格式化的表达。

## 使用脚本

优先运行 skill 同目录脚本：

```powershell
python .codex/skills/google-play-listing/scripts/listing_gate.py --root .
```

可显式提供 listing JSON 或素材目录：

```powershell
python .codex/skills/google-play-listing/scripts/listing_gate.py --root . --listing-json store/google-play-listing.json --asset-dir store-assets
```

默认也会发现常见输入：

- Listing JSON：`google-play-listing.json`、`play-store-listing.json`、`store-listing.json`、`metadata/google-play-listing.json`、`play-store-launch/inputs/google-play-listing.json`。
- Fastlane metadata：`fastlane/metadata/android/<locale>/title.txt`、`short_description.txt`、`full_description.txt`、`video.txt`。
- App identity：`app.json`、`capacitor.config.json`、`package.json`、`manifest.json`、`mobile/manifest.json`、`AndroidManifest.xml`、`strings.xml`、`pubspec.yaml`。
- Preview assets：`fastlane/metadata/android`、`metadata/android`、`store-assets`、`google-play`、`screenshots`、`assets`，或 `--asset-dir` 指定目录。

默认输出到：

```text
play-store-launch/reports/google-play-listing.zh.md
play-store-launch/reports/google-play-listing-output.json
play-store-launch/reports/google-play-listing-source-of-truth.json
play-store-launch/reports/google-play-listing-drafts.json
```

## 判定方式

脚本会解析并判定这些 gate：

- `app_identity`：是否发现可用 app name，且 title 不超过 30 字符。
- `listing_metadata_source`：是否发现明确的 listing JSON 或 Fastlane metadata。没有则只生成 `NEED_HUMAN` 草稿。
- `listing_text_fields`：app title、short description、full description 是否存在、非占位、长度合规。限制为 30、80、4000 字符。
- `metadata_policy`：检查误导、无关、过度格式化、不合适、排名、价格、促销、审核结果、商店表现和需人工确认的品牌/平台词。
- `preview_assets`：检查 app icon、feature graphic、screenshots、video 状态。app icon 必须是 512x512、32-bit PNG、最大 1024KB；feature graphic 必须是 1024x500 JPEG 或 24-bit PNG；screenshots 至少 2 张；video 可选。
- `human_required_fields`：privacy policy URL、developer contact、category、content rating、target audience 需要人工提供或确认。

## 安全边界

- 不调用 Google Play API。
- 不运行 `eas submit`、track rollout、发布上传或任何提交动作。
- 不读取或写入 Play Console 凭据、service account、keystore 或其他生产密钥。
- 不修改 app 源码、生产配置、fixture 数据或截图原图。
- 不把缺失证据、人工审核项或 blocked gate 改写成 ready。

## 输出要求

中文报告必须包含：

- 总状态。
- listing 草稿输出状态。
- 字段长度矩阵。
- preview assets 状态。
- metadata policy 风险。
- 人类需要提供什么信息。
- 阻塞项和解除方式。
- 总结。

机器报告必须包含：

- `schema_version`
- `proof_mode`
- `overall_status`
- `source_of_truth`
- `listing_drafts`
- `listing_gates`
- `blockers`
