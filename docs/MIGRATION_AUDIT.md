# Migration Audit

## Top-level Inventory

| Path | Classification | Reason |
| --- | --- | --- |
| `.tmp/` | Delete later | 临时设计产物，不应进入 Expo-first 长期结构。 |
| `admin/` | Reference only | 现有后台壳与生成页仍有业务语义，但技术路线与未来主壳无关。 |
| `backend/` | Migrate | 这里的 surface 命名与接口边界可迁移到 `packages/core-domain` 与 Supabase edge seam。 |
| `data/` | Reference only | 内容样例与规范化产物有参考价值，但内容流水线本身 out of scope。 |
| `database/` | Migrate | 这是当前最接近通用数据合同的目录，应迁入 `packages/core-contracts` 并映射到 `infra/supabase`。 |
| `docs/` | Keep | 现有治理文档仍是迁移决策与语义对照的重要依据。 |
| `domains/` | Migrate | 域包与夹具可继续提炼为 future domain contracts 与 fixtures。 |
| `fixtures/` | Keep | 测试夹具与样例应继续服务于 preflight、contract check 和后续 scaffold 验证。 |
| `mobile/` | Reference only | 这是典型 `uni-app` 主壳，应只保留为迁移参考，不再扩展。 |
| `node_modules/` | Delete later | 安装产物，不属于治理层提交目标。 |
| `ops/` | Reference only | 当前运维命令大多面向 legacy runtime / 内容发布链路，应只作流程参考。 |
| `output/` | Delete later | 阶段性输出物与证据目录，不是未来仓库结构的一部分。 |
| `packages/` | Migrate | 现有 `attention-*` 包说明团队已开始模块化，可择优吸收进 `packages/core-*`。 |
| `runtime/` | Reference only | 当前运行时 bundle、channel、release 产物主要服务 legacy 发布模型。 |
| `scripts/` | Keep | 验证、Harness 与迁移辅助脚本仍应保留，并逐步新增 Expo-first 验证。 |
| `shared/` | Migrate | 共享枚举、事件名、合同守卫与运行时配置是未来 `core-contracts/core-domain` 的直接输入。 |
| `test-results/` | Delete later | 测试输出目录应视作生成物，不进入长期骨架。 |
| `tests/` | Keep | 自动化验证能力仍有价值，可逐步迁移到 Expo-first smoke/test harness。 |
| `tmp/` | Delete later | 临时目录，不应纳入目标 repo map。 |
| `uniCloud/` | Reference only | 现有数据库 schema 与云能力命名有价值，但实现平台将迁移到 Supabase。 |
| `.env` | Unknown | 可能包含本地敏感配置；本线程不消费、不迁移，也不应假设其长期有效。 |
| `.env.example` | Migrate | 可作为 future env seam 的命名参考，但需要在 Expo/Supabase 语境下重整。 |
| `.gitignore` | Keep | 需要继续承载新工作区和生成物忽略规则。 |
| `AGENTS.md` | Keep | 这是迁移期治理入口，必须保留并按 Expo-first 更新。 |
| `app.js` | Delete later | 顶层单文件入口不符合目标结构，且不属于未来 Expo 壳。 |
| `index.html` | Delete later | 顶层静态页不属于目标移动端主壳。 |
| `package-lock.json` | Reference only | 当前仍反映 legacy npm 安装状态，但未来 workspace 以 pnpm 为主。 |
| `package.json` | Keep | 根工作区入口仍然需要保留，并最小化演进到 monorepo shell。 |
| `serve.ps1` | Reference only | 仅适合作为 legacy 本地辅助脚本参考。 |
| `snake-logic.js` | Delete later | 与目标产品骨架无关，后续应清理出主仓库。 |
| `styles.css` | Delete later | 顶层静态样式文件不属于未来 Expo-first 结构。 |

## DCloud-only Findings

以下内容明确属于 DCloud / uni-app / HBuilderX / uniCloud 专属实现，不再作为未来主壳：

- `mobile/App.vue`
- `mobile/main.js`
- `mobile/pages.json`
- `mobile/manifest.json`
- `mobile/uni_modules/`
- `mobile/uniCloud-aliyun/`
- `mobile/.hbuilderx/`
- `mobile/unpackage/`
- `uniCloud/database/`
- `scripts/bootstrap/*hbuilderx*`
- `scripts/contracts/sync-unicloud-database.*`
- `docs/MANUAL_HBUILDERX_STEPS.md`

## Reusable Shared Semantics

这些内容应在未来线程中优先迁移到 `packages/core-*`：

- `database/*.schema.json`
  - 未来进入 `packages/core-contracts`，并在 `infra/supabase` 形成表、view、RLS、RPC 设计输入。
- `shared/contracts/*`, `shared/constants/*`, `shared/utils/contract-guards.js`
  - 未来进入 `packages/core-contracts` 与 `packages/core-domain`。
- `backend/surfaces/*.mjs`
  - 未来沉淀为 `packages/core-domain` 的 use case、repository seam、edge function contract。
- `domains/*`
  - 未来沉淀为 domain fixtures、content family semantics 和命名基线。
- `fixtures/*`
  - 未来继续作为 preflight、contract tests、seed 样例来源。

## Future `packages/core-*` Mapping

- `packages/core-contracts`
  - `products`
  - `publications`
  - `articles`
  - `article_variants`
  - `user_profiles`
  - `entitlements`
  - `pricing_plans`
  - `experiments`
  - `feature_flags`
  - `event_logs`
  - `notification_*`
  - `promo_*`
  - `quota_*`
  - `referrals`
  - `reward_ledger`
- `packages/core-domain`
  - 认证/会话边界
  - 内容发现与详情 use case
  - 价格/权益/实验决策逻辑
  - 通知、关注、收藏、续读、邀请码等 domain services
- `packages/core-ui`
  - 仅承接跨页面设计 token、组件规范、文案语义和 UI seam
  - 不承接 legacy `uni-app` 页面实现本身

## Legacy Reference Boundary

以下代码当前应只保留为 reference，而不是迁移目标：

- `mobile/pages/*`
- `mobile/components/*`
- `mobile/stores/*`
- `mobile/theme/*`
- `admin/src/*`
- `runtime/*`
- `ops/*`
- `output/*`
