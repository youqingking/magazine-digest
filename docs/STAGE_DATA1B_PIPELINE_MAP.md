# Stage DATA1B Pipeline Map

## Layers

1. raw zip  
   输入是单个 zip 或一个目录下的多个 zip。

2. extracted/raw md  
   zip 解压后得到 issue 目录；也允许直接以已解压 raw 目录作为输入。

3. normalized issue/article records  
   每个 issue 产出 `manifest.json` 和 `normalized/article-*.json`。

4. publication / issue registry  
   统一登记 publication、issue、parser profile、warnings count、manifest path。

5. runtime scenarios  
   每个已导入 issue 产出具名 scenario bundle；selected scenario 再镜像到 `current`。

## Runtime Boundary

- `mobile/fixtures/runtime/scenarios/*.bundle.json` 是真实具名 scenario 源。
- `mobile/fixtures/runtime/current/*` 只是当前选中的 scenario 镜像。
- app 继续读 `current`，但 provenance 与切换由 registry + selected pointer 管理。

## Current Parameterization Targets

- zip path
- input dir
- scan dir
- scenario id
- free quota limit
- publish/select scenario
