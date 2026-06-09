# Stage REL2 Test Plan

## Goals

- 验证 dist export / verify / serve / fetch / fallback 闭环
- 验证 `remote_channel_head` 不破坏既有 local runtime source
- 验证 OBS1、OPS4、OPS5 与 REL1 衔接不回归

## Required Checks

1. 构建 `data2_multi_publication_release_candidate` release artifact
2. 发布到 `dev` channel
3. 导出 runtime dist 并验证 manifest/bundle 一致性
4. 启动本地静态服务并读取 `remote_channel_head:dev`
5. 验证 app remote-like source 命中的 release/channel 与 local `channel_head` 一致
6. 人工模拟 dist manifest/bundle 缺失，验证 fallback 与 OBS1 事件
7. rollback `dev` channel，确认 channel head 可恢复
8. 复跑 TEST1 / OPS2 / DATA2 / OPS3 / TEST2 / OPS4 / REL1 / OBS1 / OPS5 smoke

## Smoke Entry

- `node scripts/bootstrap/smoke-stage-rel2.mjs`
- `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/smoke-stage-rel2.ps1`

## Expected Reports

- `output/stage-rel2/runtime-dist-report.json`
- `output/stage-rel2/runtime-dist-verify-report.json`
- `output/stage-rel2/remote-runtime-report.json`
- `output/stage-rel2/remote-fallback-report.json`
- `output/stage-rel2/channel-export-report.json`
- `output/stage-rel2/smoke-report.json`
