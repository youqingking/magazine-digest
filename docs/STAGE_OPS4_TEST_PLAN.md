# Stage OPS4 Test Plan

## Goals

- 验证 operator console 能加载 overview / content / quality / scenario / release 数据。
- 验证通过 console API 可触发 compare / evaluate / dry-run publish / rollback。
- 验证 stateful 动作继续走已有脚本保护。

## Required Checks

1. 启动本地 operator console。
2. 拉取 overview / content / quality / scenarios / release API。
3. 触发 compare / evaluate / dry-run publish / rollback。
4. 验证 action result 写入 action report。
5. 验证 baseline/current/selected 最终仍保持可解释状态。

## Pass Criteria

- console map / actions report / smoke report 均已生成。
- `data2_multi_publication_release_candidate` 仍为 `promotable`。
- rollback 后 baseline 仍恢复为 current。
- TEST1 / OPS2 / DATA2 / OPS3 / TEST2 不回归。
