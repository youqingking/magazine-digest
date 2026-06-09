# Commands

## Root commands

- `npm run preflight`
  - 调用现有 `scripts/harness/preflight.ps1`
- `npm run install`
  - Stage C stub；不下载依赖，只输出工具状态和限制
- `npm run generate-admin`
  - 生成 `admin/pages-generated/*.generated.json`
- `npm run build:mobile`
  - 校验 mobile 壳结构与路由，不执行真实 HBuilderX 编译
- `npm run build:admin`
  - 校验 admin 静态壳与 generated 轨道
- `npm run verify`
  - 调用现有 `scripts/harness/verify.ps1` 和 `scripts/contracts/validate-stage-b.ps1`
- `npm run smoke`
  - 汇总 preflight、verify、mobile build、admin build 结果

## Current limitations

- `build:mobile` 当前是结构验证，不替代 HBuilderX 真编译。
- `build:admin` 当前验证静态 shell 与 generated 输出，不替代后续 uni-admin/template 集成。
- `install` 不会拉取官方模板；若后续要接官方模板，需要人工执行并保留当前 contract 入口。
