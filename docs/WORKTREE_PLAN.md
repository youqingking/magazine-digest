# Worktree Plan

## Branch And Thread Sequence

> 逻辑分工使用以下主题名；在 Codex Desktop 中实际创建 Git 分支时，建议加上仓库前缀 `codex/`。

| Thread | Logical branch | Suggested actual branch | Goal | Primary writable paths |
| --- | --- | --- | --- | --- |
| 1 | `feat/expo-shell-foundation` | `codex/feat-expo-shell-foundation` | 真正执行 `create-expo-app`、接入 Expo Router、建立 `apps/mobile` 基础骨架与 env seam | `apps/mobile`, `docs/NEXT_THREAD_PROMPT.md`, `scripts/validate`, root `package.json` |
| 2 | `feat/supabase-auth-data` | `codex/feat-supabase-auth-data` | 建 Supabase auth/data seam、环境变量契约、repository contract、基础 data client | `infra/supabase`, `packages/core-contracts`, `packages/core-domain`, `.env.example`, `docs` |
| 3 | `feat/reader-feed-paywall` | `codex/feat-reader-feed-paywall` | 建 reader/feed/paywall 页面骨架与 domain wiring，但不做真实订阅扣费 | `apps/mobile`, `packages/core-ui`, `packages/core-domain`, `packages/core-contracts` |
| 4 | `feat/notifications-growth` | `codex/feat-notifications-growth` | 建通知、增长、邀请码、埋点与 push seam 占位，但不接真实推送通道 | `apps/mobile`, `packages/core-domain`, `packages/core-contracts`, `docs` |

## Non-parallel Edit Rules

以下目录不应在多个实现 Worktree 中并行修改：

- `apps/mobile`
  - Expo Router、provider tree、app config、navigation shell 极易冲突，必须单线程持有。
- `packages/core-contracts`
  - schema、类型、env contract 是全局合同层，必须串行修改。
- `packages/core-domain`
  - repository seam 与 use case 容易在 auth/data 和 reader/paywall 之间冲突，必须串行修改。
- `packages/core-ui`
  - 设计 token 与基础组件应由一个线程统一演进。
- `infra/supabase`
  - schema plan、edge seam、env naming 需要单线程维护。
- `AGENTS.md`
  - 规则层只能由治理线程修改。
- `docs/STACK_DECISION.md`
  - 栈决策冻结后只能在治理线程变更。
- `docs/TARGET_REPO_MAP.md`
  - 目标结构冻结后只能在治理线程变更。

## Safe Parallel Areas

以下内容可以在不影响主实现的情况下并行补充，但仍建议保持最小范围：

- 新增 `docs/*` 说明文档
- 新增不被消费的 `fixtures/*`
- 独立的 `scripts/validate/*` 辅助脚本

## Merge Order

1. `feat/expo-shell-foundation`
2. `feat/supabase-auth-data`
3. `feat/reader-feed-paywall`
4. `feat/notifications-growth`

原因是 Expo 壳层与 env seam 必须先稳定，后续 auth/data 与页面实现才有可落点的主干。
