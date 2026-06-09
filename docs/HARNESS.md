# Harness 使用说明

## 1. 目标

在未接入正式业务代码前，先用脚本验证本地工程治理前置条件。

## 2. 脚本

- `scripts/harness/preflight.ps1`
  - 检查 Node、pnpm/npm、HBuilderX、目录结构、环境变量占位、Git 状态。
- `scripts/harness/verify.ps1`
  - 检查必需文档、脚本和夹具是否存在。
- `scripts/harness/smoke.ps1`
  - 执行轻量串联检查。
- `scripts/harness/report.ps1`
  - 输出结构化报告。

## 3. 建议执行顺序

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\harness\preflight.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\harness\verify.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\harness\smoke.ps1
```

## 4. 环境变量占位

当前仅检查是否设置，不消费真实值：

- `ALICLOUD_SPACE_ID`
- `ALICLOUD_CLIENT_SECRET`
- `UNI_ADMIN_BASE_URL`
- `PUSH_APP_KEY`
- `PRODUCT_KEY_DEFAULT`

## 5. 成功标准

- 必需目录齐全。
- 文档齐全。
- 样例夹具齐全。
- 本地工具链缺口清晰可见。
- Git 当前状态可识别。
