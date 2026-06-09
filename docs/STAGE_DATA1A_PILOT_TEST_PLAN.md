# Stage DATA1A Pilot Test Plan

## Baseline

- 非 GUI baseline
- 直接验证 normalized 产物、runtime bundle 和 local runtime adapter

## Required Checks

1. 15 篇单篇 md 被归一化
2. 四个核心内容块都存在
3. 合并成人版大文件未被误导入
4. feed discovery 可加载 15 篇真实文章
5. search 可按 publication / section / title 浏览
6. detail 可读取 `quick_30s / deep_3m / teen`
7. feed 返回态语义仍保留
8. 总量阈值 paywall 规则已接通
9. `cover / author / canonical_url` 缺失不阻塞
10. runtime bundle 已切到 `real_content_pilot`

## Run

- `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/smoke-stage-data1a-pilot.ps1`
