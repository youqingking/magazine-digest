# Next Thread Prompt

下面是一段可直接用于下一线程的完整提示词。

```text
你现在进入实现线程，角色是 Expo Shell Foundation Agent。

工作模式：
- 使用 Worktree，不要在 Local 上直接实现。
- Git 分支建议使用 `codex/feat-expo-shell-foundation`。
- 复杂任务默认使用 gpt-5.4。

目标：
- 真正把仓库推进到 Expo-first 的第一阶段。
- 允许执行 create-expo-app。
- 建立 `apps/mobile` 的 Expo + React Native + TypeScript + Expo Router 基础结构。
- 接入 env seam。
- 仍然不要做真实订阅、真实推送、真实 Supabase project。

开始前先做：
1. 检查 Git 状态并确认当前 Worktree 干净。
2. 读取这些文件作为规则层：
   - `AGENTS.md`
   - `docs/STACK_DECISION.md`
   - `docs/MIGRATION_AUDIT.md`
   - `docs/TARGET_REPO_MAP.md`
   - `docs/WORKTREE_PLAN.md`
   - `docs/VALIDATION_MATRIX.md`
   - `docs/OUT_OF_SCOPE.md`
   - `docs/NEED_HUMAN.md`

本线程允许做的事：
- 使用官方模板执行 `create-expo-app`
- 在 `apps/mobile` 中接入 TypeScript
- 接入 Expo Router
- 建立基础目录，例如 `app/`、`src/`、`components/`、`features/`、`lib/`、`providers/`
- 建立 env seam，例如 `EXPO_PUBLIC_SUPABASE_URL`、`EXPO_PUBLIC_SUPABASE_ANON_KEY`
- 建立 RevenueCat seam 占位接口
- 建立 notifications seam 占位接口
- 补充最小 typecheck / lint 脚本
- 更新 root workspace 脚本使其能指向 `apps/mobile`

本线程禁止：
- 不要写真实业务页面逻辑
- 不要实现 reader/feed/paywall 具体功能
- 不要创建真实 Supabase project
- 不要写 SQL migrations
- 不要接入真实 RevenueCat API key
- 不要接入真实 push token 注册
- 不要删除 legacy `mobile/`、`uniCloud/`、`admin/`

实现要求：
- `apps/mobile` 必须成为未来唯一正式移动端主壳的起点。
- 使用 Expo Router 文件路由，不要引入 `pages.json` 风格兼容层。
- 环境变量读取必须走 seam，不得把 URL、key、price、quota、feature flags、实验参数硬编码到页面代码里。
- 所有未来共享业务语义应尽量引用或对齐 `packages/core-contracts` / `packages/core-domain`，不要在 `apps/mobile` 里重新发明术语。
- 如需占位页面，只做最小导航骨架与 provider wiring，不做真实产品细节。

结束前必须验证：
1. `pnpm validate:preflight`
2. Expo 配置可解析
3. Expo Router 路由骨架存在
4. root 有 `typecheck` / `lint` 占位脚本
5. 输出简短报告：变更文件、执行命令、结果、剩余 NEED_HUMAN

如果缺少 Expo/EAS naming、Supabase project、RevenueCat project 等人工信息：
- 不要乱猜
- 用占位和 README 说明
- 把缺口写回 `docs/NEED_HUMAN.md`
```
