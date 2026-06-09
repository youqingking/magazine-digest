# Stage DATA1B Test Plan

## Required Coverage

- 旧 DATA1A pilot 入口仍可用
- 通用 importer 支持参数化单个输入
- 通用 importer 支持目录扫描批量输入
- Reader's Digest parser profile 仍能导入 15 篇文章
- publication / issue / scenario registry 写入正确
- selected scenario pointer 正常
- current runtime 由 selected scenario 镜像生成
- feed/search/detail/paywall/profile 关键路径不回归

## Smoke Focus

- 不做重型 GUI 自动化
- 主要验证 importer、registry、scenario publish、app runtime adapter
