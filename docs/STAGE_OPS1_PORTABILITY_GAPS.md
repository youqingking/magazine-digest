# Stage OPS1 Portability Gaps

## Before OPS1

- 导入默认依赖 `C:\Users\...\Downloads\...`
- 缺少 repo-local inbox
- operator 需要知道多个脚本入口

## After OPS1

- 默认 intake 路径是 `ops/intake/inbox/`
- 外部路径仍允许显式传入，但不再是默认假设
- 每次 intake 都会写 manifest

## Remaining Gaps

- 外部 zip 若不放入 inbox，仍需显式传参
- GUI runtime closeout 仍是人工项，不进入自动 gate
