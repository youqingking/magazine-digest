# Stage DATA2 Decisions

## Scope

- 在 DATA1D / TEST1 / OPS1 / OPS2 foundation 之上，收敛 promotion readiness 所需的内容质量噪音。
- 不重写 parser / TEST1 / OPS2 架构，只补 `warning budget + accepted registry + release-candidate scenario`。
- 保持 7-page IA、`detail` 唯一阅读页职责、Stage G、H0/H1a foundation 不变。

## Current Audit

当前 `data1c_three_release_mixed_preview` 为 `hold_warning`，主因不是 runtime / contract / lifecycle 失败，而是：

1. `the_economist__20260314`
   - unresolved warning 仍存在
   - warning taxonomy 为：
     - `economist_section_context_fallback`
     - `economist_filename_anomaly`
   - 当前已收敛到单文章 `art_the_economist_20260314_024`
2. mixed preview 相对 baseline/current 的 warning taxonomy 增长
3. mixed preview 相对 baseline/current 的 override count drift
4. Reader's Digest baseline 仍保留 `best_effort_ordinal_missing`，但它不是 mixed preview 的直接 hold 根因

## DATA2 Decisions

- `data1c_three_release_mixed_preview` 继续保留为 preview-oriented mixed scenario。
- DATA2 不把 mixed preview 强行降格为 `promotable` 成功标准。
- DATA2 新增一个 multi-publication release-candidate scenario，由通过 budget 的 issue 组成。
- DATA2 验证完成后，本地 `current_mirror` / true-device 默认目标应回到四刊 release-candidate，而不是继续停在三刊 preview。
- `data1c_three_release_mixed_preview` 保留为显式 comparison / QA source，不再作为日常 current 默认读源。
- 当前 release-candidate 采用：
  - `readers_digest__12112025`
  - `barrons__09022026`
  - `the_atlantic__012026`
  - `the_economist__20260314`
- Reader's Digest 与 The Economist 继续保留告警可追踪性，但其 accepted warning / override drift 已正式登记进 DATA2 candidate，不再只停留在 preview-only 语义。

## Quality Classification

- `readers_digest__12112025`
  - 归类：`accepted_best_effort`
  - 说明：`ordinal` 缺口继续保留在 baseline 语义中，同时以 accepted best-effort 方式进入四刊 candidate
- `barrons__09022026`
  - 归类：`release_ready`
- `the_atlantic__012026`
  - 归类：`release_ready_with_editorial_overrides`
  - override 多，但 unresolved warning 为 0
- `the_economist__20260314`
  - 归类：`accepted_release_candidate_anomaly`
  - 允许继续留在 mixed preview
  - 在 DATA2 四刊 candidate 中以显式 accepted warning / override drift 方式纳入，不再隐式排除

## Non-goals

- 不做 full editorial CMS
- 不做复杂 anomaly workflow
- 不让 `--force-with-warning` 成为成功标准
- 不把 RC2 manual runtime closeout 混入 DATA2 gate
