# Stage C Decisions

## Scope freeze

- Stage C 只交付 bootstrap shell，不进入真实业务实现。
- Stage B 金额、时区、奖励、折扣语义保持不变：
  - timezone = `Asia/Shanghai`
  - money unit = `fen`
  - discount canonical = `price_multiplier_basis_points`
  - reward canonical = `vip_days`

## Generated track

当前明确采用 `admin/pages-generated/` 作为生成轨道。

优先走 generated 的后台资源：

- `products`
- `publications`
- `articles`
- `pricing_plans`
- `quota_policies`
- `promo_campaigns`
- `promo_codes`
- `feature_flags`
- `experiments`

原因：

- 这些资源在 Stage B 已具备清晰 schema，适合继续接 schema2code / generated CRUD。

## Manual track

当前保留手写壳或 workflow contract 的后台模块：

- `article_variants` 发布流
- `pricing engine`
- `referral anti-abuse`
- `content preview / fallback safety check`
- `metrics dashboard`

原因：

- 这些模块包含状态机、安全边界、审计或聚合流程，不适合在 Stage C 直接退化成普通 CRUD。

## Mapping to Stage B contracts

- `mobile/services/content-sync.service.js` 对齐 `content.syncDelta` 与 `docs/CONTENT_SYNC.md`
- `mobile/services/entitlement.service.js` 对齐 `access.evaluate` 与 `docs/API_CONTRACTS.md`
- `mobile/services/pricing.service.js` 对齐 `docs/RULE_PRECEDENCE.md` 与 `docs/TIME_AND_MONEY_RULES.md`
- `mobile/services/experiment.service.js` 对齐 `experiments` / `experiment_assignments`
- `mobile/services/event-ingest.service.js` 对齐 `event.ingest` 与 `event_logs_raw`
- `shared/contracts/*` 只沉淀冻结枚举，不扩张 schema
- `admin/pages-generated/*.generated.json` 仅作为 generated 轨道占位，source of truth 仍是 `database/*.schema.json`

## Minimal supplements

- 新增 Stage C 文档只记录 shell 决策、工具差异和人工步骤。
- 未修改任何 Stage B schema。
- 未新增单一 `app_config` 真理表。
