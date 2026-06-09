# Stage REL1 Runtime Source Model

## Modes

- `current_mirror`
  - 兼容既有本地开发语义
  - 实际读取 `mobile/fixtures/runtime/current/*`
  - REL2 / 真机验证阶段默认应指向四刊 `data2_multi_publication_release_candidate`
- `scenario_preview`
  - 显式指向命名 scenario
  - 典型对照目标：`data1c_three_release_mixed_preview`
- `channel_head`
  - 显式指向某个 channel 的当前 release
  - 典型目标：`dev`

## Default Runtime Expectation

- local / H5 / 真机的 local-first 路径默认都先读 `current_mirror`。
- 因此要看日常可运营版本，应让 `current_mirror` 指向四刊 `data2_multi_publication_release_candidate`。
- `data1c_three_release_mixed_preview` 继续保留为显式 preview source，只在对照 QA 时手动切换。
- feed 的来源筛选应以 runtime 实际可见刊物为准，并按当前阅读/更新信号排序，而不是被导入顺序偶然决定。

## Expected Runtime Targets

- QA 预览三刊：`mode=scenario_preview`, `scenario=data1c_three_release_mixed_preview`
- RC / current 预览四刊：`mode=current_mirror` 或 `mode=scenario_preview`, `scenario=data2_multi_publication_release_candidate`
- channel 验证：`mode=channel_head`, `channel=dev|staging|production`
