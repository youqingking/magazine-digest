# Stage REL2 Decisions

## Scope

- 在 REL1 immutable release artifact 与 channel head 模型之上，新增一层 static-friendly runtime distribution bridge。
- 保持现有 `current_mirror`、`scenario_preview`、`channel_head` 本地开发语义不变。
- 新增 `remote_channel_head` 作为 remote-like runtime source mode，用于模拟未来静态托管 / 对象存储 / CDN 消费路径。

## Confirmed Foundations Kept Intact

- 7 个正式页面 IA 冻结，不重开。
- `detail` 仍是唯一阅读页，默认 `quick_30s`，顶部切 `deep_3m`。
- Stage G、H0、H1a foundation 不改。
- REL1 的 release artifact / channel head 继续作为 source of truth。
- OBS1 observability 继续作为 runtime/source/release 故障追踪底座。
- OPS4 / OPS5 operator console 只做最小接入，不重做后台。

## Gap Audit

当前已具备：

- `runtime/releases/<release-id>` immutable artifact
- `runtime/channels/<channel>/manifest.json` channel head + history
- `current_mirror` / `scenario_preview` / `channel_head` runtime source
- publish / promote / rollback / release reports
- observability / triage / operator console / editorial CRUD

当前仍缺：

1. 一层专门面向远程样式消费的 export layout
2. 静态托管友好的 channel manifest 与 release bundle 路径
3. 本地可运行的 dist serve / verify 闭环
4. app 侧 `remote_channel_head` 解析、fetch 与 fallback
5. 面向 operator 的 dist / remote source 状态视图

## Decisions

1. REL2 不改变 release artifact 生成逻辑，只增加 `runtime/dist/*` 导出层。
2. dist export 从 REL1 release/channel source of truth 生成，可重复、可清理、可验证。
3. app remote-like runtime 最小读取单元固定为：
   - `runtime/dist/index.json`
   - `runtime/dist/channels/<channel>/manifest.json`
   - `runtime/dist/releases/<release-id>/manifest.json`
   - `runtime/dist/releases/<release-id>/bundle.json`
4. `remote_channel_head` 仅在 dev-only/runtime config 下启用，不替代默认本地 current。
5. fallback 顺序固定为：
   - `remote_channel_head`
   - local `channel_head`
   - local `current_mirror`
6. fallback 必须产生 OBS1 结构化事件，不允许 silent failure。
7. preview-only scenario 继续受 REL1 / OPS2 / DATA2 gate 保护，不因 dist export 被绕过。

## Non-goals

- 不做真实云存储、CDN、缓存失效平台
- 不做 GitHub Actions / 远程 CI
- 不做复杂 RBAC / 多租户发布后台
- 不做新的终端用户 UI 大改
- 不让 app 直接读取 operator console 内部数据结构
