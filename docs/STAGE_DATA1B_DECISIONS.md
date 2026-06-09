# Stage DATA1B Decisions

## Scope

- 把 DATA1A 的 Reader's Digest 单刊单期 importer 提升为可参数化、可批量复用的多 zip 管线。
- 保留 DATA1A 的字段映射、paywall 测试规则、detail/general 兼容策略。
- 不重做 feed/search/detail/paywall/profile 的 UI 与职责。

## Reused From DATA1A

- Reader's Digest 正文标签 parser 规则。
- `quick_30s / deep_3m / teen variants` 的字段映射。
- `general <- adult` 的 detail 兼容派生。
- Stage G 的 quota/offer/promo/campaign 读取方式。
- local runtime bundle 驱动 app 的模式。

## DATA1B New Decisions

- 新增通用入口 `scripts/import/import-content-batch.mjs`。
- Reader's Digest 解析逻辑下沉为 parser profile：`readers_digest_v1`。
- `current runtime` 不再是唯一内容源，只是 selected scenario 的镜像。
- 真实样本改为通过 publication / issue / scenario 注册表追踪。
- 旧 `import-readers-digest-pilot.mjs` 保留为兼容包装器。

## Non-Goals

- 不做 full CMS / admin。
- 不适配所有未知刊物格式。
- 不改变 7 页 IA、不改变唯一 detail 阅读页。
