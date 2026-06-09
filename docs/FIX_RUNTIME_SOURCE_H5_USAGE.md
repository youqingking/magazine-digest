# HBuilderX / H5 / 真机 Runtime Source 使用方法

## 默认四刊 current mirror

当前本地默认 runtime target 应是四刊 release-candidate：

- `mode=current_mirror`
- `scenario=data2_multi_publication_release_candidate`

可用命令：

```powershell
node scripts/ops/set-runtime-source.mjs --mode current_mirror
```

切完后重新打开 HBuilderX / H5 / 真机，dev-only 区块应看到：

- 运行模式：`current_mirror`
- current mirror：`data2_multi_publication_release_candidate`
- 来源筛选可见四刊：
  - `readers_digest`
  - `barrons`
  - `the_atlantic`
  - `the_economist`

## 切到三刊 QA preview

```powershell
node scripts/ops/set-runtime-source.mjs --mode scenario_preview --scenario data1c_three_release_mixed_preview --for-h5-dev
```

这个命令会同时完成两件事：

1. 把 runtime source 标记为 `scenario_preview:data1c_three_release_mixed_preview`
2. 把三刊 preview 明确同步到 H5 dev 实际会读取的 `current` mirror

切完后，重新打开或刷新 HBuilderX / H5 预览，settings 的 dev-only 区块应看到：

- 运行模式：`scenario_preview`
- 场景：`data1c_three_release_mixed_preview`
- current mirror：`data1c_three_release_mixed_preview`

并且 feed / search 中应能看到：

- `barrons`
- `the_atlantic`
- `the_economist`

三刊 preview 只用于 comparison / QA，不应继续作为真机默认 current source。

## 查看当前 source

```powershell
node scripts/ops/show-runtime-source.mjs
```

## 切回四刊 current mirror

```powershell
node scripts/ops/set-runtime-source.mjs --mode current_mirror
```

这个恢复动作会：

1. 把 runtime source 设回 `current_mirror`
2. 按当前 `selected` 场景重建本地 `current` mirror；在当前 repo 状态下应恢复为四刊 candidate

它不会改 production / channel 语义，只用于本地 H5 开发态恢复。
