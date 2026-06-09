# Stage C Bootstrap Gap

## Current gap

- 仓库当前没有直接接入官方 `uni-starter v2` 或 `uni-admin` 完整模板。
- Stage C 先补齐可编译目标的目录结构、页面壳、generated 轨道和验证入口。
- `mobile/` 采用 uni-app 约定目录，等待人工在 HBuilderX 中导入和继续集成。
- `admin/` 采用零依赖静态 ESM shell，避免在当前环境因为模板缺失或网络限制卡住 Stage C。

## Why this is acceptable in Stage C

- 不推翻 Stage A / Stage B 合同。
- 为 schema2code 与 generated 管道预留了 `admin/pages-generated/`。
- build 与 smoke 命令可以执行，并明确区分“结构校验通过”和“真实编译仍需桌面工具”。

## Recorded differences

- `mobile/` 不是直接从官方模板拉起，而是等价 uni-app 壳结构。
- `admin/` 不是完整 `uni-admin` 安装物，而是保留 generated/manual 双轨的后台骨架。
- 真实 HBuilderX 编译、uniCloud 空间绑定、后台模板替换，延后到人工或后续线程完成。
