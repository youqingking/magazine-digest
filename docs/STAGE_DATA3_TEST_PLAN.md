# Stage DATA3 Test Plan

## Goals

- 验证 canonical taxonomy 已写入 normalized records 与 scenario bundles。
- 验证 taxonomy coverage / unmapped / drift 报告可生成。
- 验证 search / feed / detail 消费 canonical metadata 不回归。
- 验证至少一个多刊 scenario 在 DATA3 后仍保持 `promotable`。

## Required Checks

1. 运行 taxonomy normalization / report 生成。
2. 验证 `data2_multi_publication_release_candidate` taxonomy coverage 为可发布状态。
3. 验证 `data1c_three_release_mixed_preview` 仍是 preview-only。
4. 顺序运行 TEST1 / OPS2 / DATA2 / OPS3 / TEST2 smoke，避免共享状态竞争。
5. 运行 DATA3 smoke，确认 baseline selected/current 未漂移。

## Pass Criteria

- canonical coverage report 已生成，且当前四刊 raw labels 都可解释。
- unmapped labels 没有造成 candidate promotion regression。
- `data2_multi_publication_release_candidate` 仍为 `promotable`。
- 所有 contract / harness / smoke 验证通过。
