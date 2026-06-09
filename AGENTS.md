# Repo AGENTS

## Role

- 默认把自己当作本项目的 `Repo Bootstrap Agent + Migration Architect`。
- 复杂任务默认使用 `gpt-5.4`；只有快节奏微迭代才使用 `GPT-5.3-Codex-Spark`。
- 当前主目标是把仓库冻结为 `Expo-first` 的可执行起点，优先做治理、目录、迁移边界、脚本和验证。

## Working Agreements

- 架构改动一律先文档后代码；先写决策与边界，再做实现线程。
- 不直接写业务功能，除非新线程明确进入实现阶段。
- 优先复用官方模板、共享模块、codegen 与生成页面，避免手写重复 CRUD。
- 产品价格、免费额度、订阅权益、feature flags、实验参数、运营阈值、风控阈值禁止硬编码。
- 所有关键数据、配置、事件设计必须支持 `product_key`。
- 不实现内容生产流水线；`PDF / web / prompt -> markdown` 永远在仓库外。
- 现有 DCloud / uni-app / uniCloud 代码视为 migration reference，不再作为未来主壳。

## Execution Discipline

- 每个线程结束都必须运行能运行的验证，并输出简短报告：
  - 变更文件
  - 执行命令
  - 结果
  - 剩余 `NEED_HUMAN`
- 同类错误连续 3 次失败则停止继续试错，直接返回 `NEED_HUMAN`。
- 关键阶段前后都要创建 git checkpoint；如果无法安全提交，明确说明原因。
- 缺少账号、凭据、服务空间、桌面工具时，不得偷偷跳过风险提示，必须写入 `docs/NEED_HUMAN.md`。

## Local And Worktree

- `Local` 主要用于审阅、合并、规则层、治理文档、迁移审计和轻量修订。
- 真正实现线程优先使用 `Worktree`，避免实现线程互相污染。
- 涉及 Expo 壳层、Supabase 接线、订阅与推送 seam 的并行开发，默认拆到独立 Worktree。

## Target Stack Freeze

- 前端主壳：`Expo + React Native + TypeScript + Expo Router + EAS`
- 后端：`Supabase`
- 订阅：`RevenueCat`
- 推送：`expo-notifications / Expo Push`，并保留后续直连 `FCM/APNs` 的 seam

## Repo Boundary

- 本仓库只接收外部流水线产出的标准化内容与元数据。
- 不在 App 仓库里做外部内容抓取、PDF 解析、Prompt 生成、Markdown 生产或流水线调度。
- legacy `mobile/`、`uniCloud/`、`admin/` 只作为 reference 保留，后续正式实现进入 `apps/mobile`、`packages/core-*`、`infra/supabase`。
