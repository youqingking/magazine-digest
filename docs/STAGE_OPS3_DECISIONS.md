# Stage OPS3 Decisions

## Scope

- 在 OPS2 / DATA2 已成立的 promotion decision 之上，补齐一次真实但可回退的 apply publish drill。
- 不重开 IA，不改 `detail` 唯一阅读页职责，不改 Stage G / H0 / H1a foundation。
- 不把 RC1 / RC2 manual runtime closeout 混入自动 publish gate。

## Drill Candidate

- 本次真实 apply drill 仅针对：
  - `data2_multi_publication_release_candidate`
- `data1c_three_release_mixed_preview` 继续保留为 preview-only：
  - 可 inspect / compare / gate / evaluate
  - 不允许作为 OPS3 主线 drill 的真实 apply 目标

## Initial State

- baseline scenario:
  - `data1a_readers_digest_12112025`
- current scenario:
  - `data1a_readers_digest_12112025`
- selected scenario:
  - `data1a_readers_digest_12112025`

## Apply Preconditions

真实 apply 之前必须同时满足：

1. scenario 存在且未 retired
2. OPS1 gate 为 `passed`
3. OPS2 promotion decision 为 `promotable`
4. DATA2 warning budget / accepted registry 已消费完毕，无未接受 warning
5. baseline / selected / current provenance 完整可读

## Apply Outcome Expectations

对 `data2_multi_publication_release_candidate` 执行真实 apply 后，应看到：

- `selected/current` 指向该 candidate
- current mirror metadata 的 `selected_scenario_id` 更新
- publish history 追加 `publish` / `promote_apply`
- operator-facing release artifacts 已生成
- provenance snapshot 记录 apply 前后差异

## Rollback Outcome Expectations

drill 结束后默认恢复 baseline：

- selected scenario:
  - `data1a_readers_digest_12112025`
- current scenario:
  - `data1a_readers_digest_12112025`
- post-rollback snapshot 必须证明恢复完成

## Severity Rules

- blocker:
  - candidate 不存在
  - candidate 非 `promotable`
  - apply 后 selected/current 未同步到 candidate
  - rollback 后 baseline 未恢复
  - provenance / manifest / release notes / drill report 缺失
- warning:
  - git tag / branch / sha 只能 best-effort 读取
  - release notes 中存在 informational diff，但不影响 `promotable`

## Default End State

- OPS3 结束后默认恢复 baseline 为 current
- 不允许留下不可解释的 `selected/current` 漂移
