# Stage REL2 Runtime Fetch Model

## Runtime Source Modes

- `current_mirror`
- `scenario_preview`
- `channel_head`
- `remote_channel_head`

## Remote-like Read Path

1. 读取 runtime source 配置中的 `channel` 与 `remote_base_url`
2. 请求 `<remote_base_url>/channels/<channel>/manifest.json`
3. 从 channel manifest 解析 `release_id` 与 `bundle_path`
4. 请求 release bundle
5. 将 bundle 归一化为与本地 channel head 一致的 runtime fixtures

## Required Runtime Context

`remote_channel_head` 必须记录：

- `channel`
- `release_id`
- `remote_base_url`
- `resolved_manifest_url`
- `resolved_bundle_url`
- `fallback_applied`

## App Integration Boundary

- fetch 逻辑放在独立 remote runtime service
- runtime source service 负责 source 选择、resolve、fallback、summary
- local runtime API 继续提供本地 fixture 读取
- remote runtime API 负责 remote-like channel manifest / bundle fetch

## Success Contract

- remote-like dev channel 成功加载后，返回的 discovery/detail/search 数据结构与 local `channel_head` 一致
- 当前 dev/current 推荐以四刊 candidate 为主，三刊 mixed preview 继续保留为 comparison-only source
- remote/local fallback 恢复到 `current_mirror` 时，也应继续命中四刊 candidate；只有显式切到 `scenario_preview:data1c_three_release_mixed_preview` 才允许把刊物范围收窄到三刊
- settings dev-only 可展示 remote source provenance 与最后一次健康状态
- 普通用户主界面不显示内部 manifest / event 名称

## Internal Release Bridge Workflow

- 这条链路的正确产品形态不是“内容一变就重打包”，而是：
  1. 安装一次支持 remote bridge 的内部包
  2. 在 app 设置里保存可达的 `remote_base_url` 与 `channel`
  3. 切到 `hybrid` 或 `remote`
  4. 后续内容通过 channel publish + dist export 更新
  5. 已安装客户端在下次启动 / 回前台时自动拉新内容
- 对已经装好的旧包，如果包内没有可编辑的 remote bridge 配置入口，则无法通过后台单独补出这条能力；这种情况下允许做最后一次内部包更新，但目标是之后不再为内容变化重复打包。
- 对内部发布版而言，首页“消息摘要”必须优先反映 publish batch / release 更新，而不是长期停留在本地样例未读数。
- publish batch 摘要允许由 runtime fixtures 内的 `publishBatches` 直接推导；即使显式 inbox 为空，客户端也应能据此告诉用户“更新了什么”，从而避免把内容更新再次误解为“必须重装 app”。
