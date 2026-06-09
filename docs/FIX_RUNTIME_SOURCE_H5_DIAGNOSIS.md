# FIX-RUNTIME-SOURCE-1 Diagnosis

## 当前 HBuilderX / H5 开发态到底读什么

- app 本地内容入口在 [local-runtime-api.js](/D:/ws/Playground/mobile/api/local-runtime-api.js)。
- `activeFixtures()` 调用 [runtime-source.service.js](/D:/ws/Playground/mobile/services/runtime-source.service.js) 的 `resolveRuntimeFixtures()`。
- `runtime-source.service.js` 当前通过静态 `import` 读取：
  - `mobile/fixtures/runtime/runtime-source.js`
  - `mobile/fixtures/runtime/source-registry.js`
- 如果 `mode=scenario_preview` 或 `mode=channel_head` 能被运行态采纳，就会读对应 scenario/release bundle。
- 否则会回退到 `mobile/fixtures/runtime/current/index.js`，也就是 `current_mirror`。

## 为什么之前一直回到 Readers Digest baseline

- 当前仓库中的 `runtime-source.json/js` 当时实际是：
  - `mode=current_mirror`
  - `scenario_id=null`
- `current` mirror 里的 metadata 仍是：
  - `selected_scenario_id=data1a_readers_digest_12112025`
- 所以 H5/HBuilderX 预览自然只会看到 `readers_digest`。

## 为什么单纯 set-runtime-source 在 H5 dev 下不够稳

- CLI 的 `set-runtime-source.mjs` 确实会写：
  - `mobile/fixtures/runtime/runtime-source.json`
  - `mobile/fixtures/runtime/runtime-source.js`
- 但 app 端是通过静态 `import runtime-source.js` 读取 source。
- 在 HBuilderX / H5 开发态中，这更像“编译时模块快照”，不是一个明确的 dev runtime override 通道。
- 结果是：
  - CLI 侧 `show-runtime-source` 可能已经看到 preview
  - 但 H5 正在运行的 dev 包，仍可能继续展示旧的 `current_mirror`

## 哪一步把 app 兜回了 current_mirror

- 兜回点在 [runtime-source.service.js](/D:/ws/Playground/mobile/services/runtime-source.service.js)：
  - 当 `runtime-source.js` 没有被运行中的 H5 dev 包及时采纳时
  - `resolveRuntimeFixtures()` 会继续使用 `currentRuntimeFixtures`
- 而 `currentRuntimeFixtures` 当前仍是 baseline `data1a_readers_digest_12112025`

## 归因

- 主因：H5 开发态 runtime source 采纳链路不够稳定
- 次因：当前 mirror 默认仍是 baseline
- 类型判断：
  - `app 代码逻辑问题`：有
  - `H5 打包/读取路径问题`：有
  - `fixture 同步问题`：有，但不是数据缺失
  - `dev-only fallback 逻辑问题`：有

## 最小且稳的修法

- 保留现有 `runtime_source` 模型
- 为 H5 dev 增加显式 dev-only preview 同步：
  - `set-runtime-source --mode scenario_preview --scenario ... --for-h5-dev`
- 这个动作同时做两件事：
  1. 正常写 `runtime-source.json/js`
  2. 将 preview scenario 明确同步进 `mobile/fixtures/runtime/current/*`，但只作为 dev preview mirror，不改 `selected` / `channel`
- app 侧再增加一个低成本保护：
  - 如果 `current` mirror metadata 标记了 `dev_preview_source_mode`
  - 则 settings / runtime proof 优先显示这个 effective source

## 修复目标

- HBuilderX / H5 开发态可稳定看到：
  - `barrons`
  - `the_atlantic`
  - `the_economist`
- settings dev-only 中显示的是 preview source，而不是 baseline current mirror
- baseline / selected / channel 语义不被打坏
