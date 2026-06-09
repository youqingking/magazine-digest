# Stage DATA1D Decisions

## Scope

- 不扩张导入架构，只提升已有真实内容的 metadata 质量。
- 在 parser profile 之上增加可追踪的 editorial override 层。
- 将 scenario 的 selected / publish / rollback / retire 收成轻量脚本与报告。
- 保留 Reader's Digest baseline 与 DATA1C mixed preview 并存。

## Priorities

1. `the_atlantic`：优先清理标题截断 warning 对 feed/search 显示的污染。
2. `the_economist`：优先降低 section context fallback，并稳定 section_label。
3. `barrons`：确认 publication id / display name / issue label 不再泄漏编码问题。

## Non-goals

- 不重开 7 页 IA。
- 不重做 UI2/UI3 页面结构。
- 不改 detail 的唯一阅读页职责与 mode 消费。
- 不做 full CMS、后台审核流、复杂 RBAC 或统计平台。
