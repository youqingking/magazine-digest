# 数据契约索引

本文件在 Stage B 起不再承载具体表设计，只作为入口索引，避免旧的 `runtime_config` / `coupon_*` 命名继续被误用。

## 权威文档

- `docs/STAGE_B_DECISIONS.md`
- `docs/RULE_PRECEDENCE.md`
- `docs/INDEX_AND_IDEMPOTENCY.md`
- `docs/STATE_MACHINES.md`
- `docs/API_CONTRACTS.md`
- `docs/CONTENT_SYNC.md`
- `docs/TIME_AND_MONEY_RULES.md`
- `docs/RBAC.md`
- `docs/LEGACY_MAPPING.md`

## 权威 schema

所有冻结后的表结构位于 `database/*.schema.json`。

## Stage B 原则

- 不创建单一 `app_config` 真理表
- 不在本仓库实现外部内容生产流水线
- 不把订单事实或订阅事实写进 `entitlements`
- 不把 teen 模式设计成简单布尔过滤
