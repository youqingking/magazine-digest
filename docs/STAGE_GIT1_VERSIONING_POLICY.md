# Stage GIT1 Versioning Policy

## From GIT1 Forward

1. 每个新 stage 至少完成：
   - stage docs / reports ready
   - relevant validators / smokes green
   - 独立 commit
   - 如值得回退或对账，则创建 annotated tag
2. 不再跨多个 stage 长时间不 commit。
3. publish gate、TEST1、scenario registry、selected/current mirror 的重大变化前后优先 checkpoint。

## Tracked vs Ignored

- tracked:
  - source code
  - scripts
  - canonical docs
  - registries / overrides / normalized data
  - runtime scenarios
  - current mirror
  - canonical reports used by gate or audit
- ignored:
  - IDE local config
  - local build outputs
  - extraction temp directories
  - intake zip payload copies
  - transient logs / screenshots

## Why `.gitignore` Changed

- `mobile/.hbuilderx/` contains machine-specific IDE launch config.
- `mobile/unpackage/` contains generated build artifacts.
- `output/stage-data1c/extracted/` is a temporary unzip workspace.
- `output/stage-data1a-pilot/extracted/`, `output/stage-data1b/extracted/`, and `output/stage-data1b/temp-batch/` are temporary import workspaces.
- `output/stage-ui35-h5/*.log` and `*.png` are transient proof artifacts, not canonical gate inputs.
- `ops/intake/inbox/*.zip` and `ops/intake/archive/*.zip` are portable operator inputs, but source packs themselves should not become baseline repo history by default.

## Historical Honesty

- 仅从 GIT1 开始建立 commit/tag discipline。
- 不回填、不伪造 DATA/UI/TEST/OPS 各 stage 的历史 tag。
