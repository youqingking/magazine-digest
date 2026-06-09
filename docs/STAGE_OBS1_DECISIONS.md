# Stage OBS1 Decisions

## Scope

- 在不重开 IA、不改变 `detail` 唯一阅读页职责、不推翻 Stage G / H0 / H1a foundation 的前提下，补一层 release-aware runtime observability。
- 目标不是做云监控平台，而是让 repo-local app/runtime/ops/release/channel 具备最小可运营的运行可见性与事故排查底座。

## Foundations Kept Intact

- 7 个正式页面 IA 冻结，OBS1 不新增正式页面。
- `detail` 仍是唯一阅读页，默认 `quick_30s`，顶部切 `deep_3m`。
- 现有 `selected/current mirror/channel head/runtime source` 语义不改。
- TEST1 / TEST2 / OPS2 / OPS3 / OPS4 / REL1 继续是上游事实源，OBS1 只接入、汇总、诊断，不替代 gate。

## Audit Summary

当前已存在的高价值状态源：

- runtime source:
  - `mobile/fixtures/runtime/runtime-source.json`
  - `mobile/fixtures/runtime/current/scenario-meta.json`
  - `mobile/fixtures/runtime/source-registry.generated.json`
- promotion / release / channel:
  - `output/stage-ops2/*.json`
  - `output/stage-ops3/*.json`
  - `runtime/releases/*`
  - `runtime/channels/*`
- runtime content:
  - `mobile/services/*`
  - `mobile/pages/feed/index.vue`
  - `mobile/pages/search/index.vue`
  - `mobile/pages/detail/index.vue`
- operator surface:
  - `ops/console/*`
  - `scripts/ops/start-operator-console.mjs`

当前缺口：

1. 没有统一 event schema，runtime / ops / release 事件分散在脚本 stdout、report、local memory 中。
2. publish / rollback / runtime source switch / channel head resolve 缺少统一的 release-aware telemetry。
3. app 内容加载失败、taxonomy gap、source 解析失败没有统一 incident 归档。
4. operator console 只能看静态 report，不能直接看到 recent incidents / source health / channel health。

## OBS1 v1 Decisions

- 统一 schema 以 `docs/STAGE_OBS1_EVENT_MODEL.md` 为准，并强制携带 `product_key`。
- sink 首版采用 repo-local file sink：
  - canonical event files：`runtime/observability/events/`
  - incident summaries：`runtime/observability/incidents/`
  - summary snapshots：`runtime/observability/summaries/`
  - operator-facing reports：`output/stage-obs1/`
- 事件写入采用：
  - unique event file
  - atomic write
  - bounded retention
  - summary rebuild
- app 侧不把主界面变成调试面板：
  - 关键内容路径写本地轻量 telemetry
  - settings dev-only 低强调展示 provenance / health / recent runtime errors
- ops / release 脚本在关键动作写正式事件，并刷新 OBS1 triage reports。

## High-value Telemetry Actions

必须落 telemetry 的动作：

1. runtime source 读取、切换、解析失败。
2. scenario bundle / channel head / release manifest 解析。
3. feed / search / detail 关键内容加载成功与失败。
4. publication / issue / article 级内容缺失或 payload 不完整。
5. promotion evaluation、release artifact build、channel publish、channel rollback。
6. publish / rollback 后的读取异常、taxonomy gap、warning budget 异常。

## Triage Questions OBS1 Must Answer

1. app 当前读的是哪种 source，以及它对应的 scenario / channel / release 是什么。
2. 最近是否发生 source / channel / scenario resolution failure。
3. 最近哪些 publication / issue / article 加载失败最多。
4. taxonomy gap 是否增加，是否已越过 warning budget。
5. 最近一次 publish / rollback 后是否出现内容读取异常。
6. dev / staging / production channel 当前 health 如何。

## Non-goals

- 不做第三方 SaaS 接入。
- 不做复杂告警路由。
- 不做 BI / analytics warehouse。
- 不做用户行为漏斗分析。
- 不把 OBS1 变成 RC2 替代物。
