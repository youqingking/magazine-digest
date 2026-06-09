# Stage REL1 Test Plan

## Primary Checks

1. `data2_multi_publication_release_candidate` 能构建 immutable release artifact。
2. `dev` channel 可 apply 该 artifact。
3. `production` channel 明确拒绝 `data1c_three_release_mixed_preview`。
4. runtime source 可切换：
   - `current_mirror`
   - `scenario_preview:data1c_three_release_mixed_preview`
   - `channel_head:dev`
5. H5 preview report 能解释三刊之前不可见的原因。
6. copy polish 后普通页面不再直出不必要英文/内部术语。
7. OPS2 / DATA2 / OPS3 / TEST2 / OPS4 不回归。

## Execution Notes

- 所有 stateful smoke 顺序执行。
- channel publish / rollback 使用现有 TEST2 lock。
- 若 Windows rename 临时锁再出现，先恢复状态再顺序重跑。
