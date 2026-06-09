# Stage DATA1A Pilot Decisions

## Scope

- 只处理 `Reader's Digest-12112025.zip`
- 只导入 15 篇单篇 md
- 合并成人版大文件只做目录表与元数据补齐，不导入正文 article
- app 继续吃 normalized JSON snapshots 和 local runtime bundle，不直接吃 zip

## Frozen Product Constraints

- 7 页 IA 不变
- `detail` 仍是唯一阅读页
- `quick_30s` 默认进入，`deep_3m` 顶部切换
- Stage G 与 H0/H1a foundation 不删除、不降级

## Runtime Decision

- DATA1A pilot 使用 `mobile/fixtures/runtime/current/runtime.bundle.json` 承接真实样本
- `source_kind = real_content_pilot`
- 不推翻现有 `runtimeGateway -> local-runtime-api -> stores/pages` 形状

## Minimal Compatibility Extension

- 源 md 只有成人/少年四块，没有显式 `general`
- 为兼容当前 detail 默认 `general` audience，runtime adapter 派生：
  - `general_quick_30s <- adult quick_30s`
  - `general_deep_3m <- adult deep_3m`
- 该派生只用于运行时兼容，不改变原始归一化来源字段

## Search / Discovery Decision

- publication 固定为 `readers_digest`
- section 先作为 tag/filter 输入接到现有搜索页
- feed 继续通过 discovery home 模块显示，不新增“期刊页”

## Paywall Test Rule

- 本阶段使用总量阈值测试规则
- `free_quota_limit = 8`
- 来源记录为 `derived_from_runtime_test_rule`
- 不把正式商业规则写死进每篇 md
