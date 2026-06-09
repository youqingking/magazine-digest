# Manual HBuilderX Steps

## When manual work is required

- 本机缺少 HBuilderX 或未配置 uni-app 编译能力时。
- 需要把 `mobile/` 壳结构导入 HBuilderX 做真实编译验证时。
- 需要后续接 uniCloud 服务空间时。

## Current machine discovery

- 当前机器已确认 HBuilderX 可执行路径为 `D:\HBuilderX\HBuilderX.exe`。
- Stage E1.1 脚本优先按以下顺序发现 HBuilderX：
  1. `D:\HBuilderX\HBuilderX.exe`
  2. 环境变量 `HBUILDERX_EXE`
  3. 环境变量 `HBUILDERX_PATH`
  4. 常见默认安装路径

## Steps

1. 打开 `D:\HBuilderX\HBuilderX.exe`，或用同一可执行文件对应的 HBuilderX 安装。
2. 选择“打开目录”，导入 `/D:/ws/Playground/mobile`。
3. 确认 `pages.json`、`manifest.json`、`App.vue`、`main.js` 被识别为 uni-app 工程。
4. 在 HBuilderX 内执行基础编译，目标优先 Android。
5. 若后续接 uniCloud，手工绑定测试空间，但不要写入真实生产凭据。
6. 若需要替换为官方模板，保留现有页面路径、shared contract 入口和 `admin/pages-generated/` 轨道。

## Guardrails

- 不接真实支付凭据。
- 不接真实推送凭据。
- 不接真实 Space ID 到仓库示例文件。
- 不在此阶段实现真实下单、真实 entitlement grant、真实 referral bind。
