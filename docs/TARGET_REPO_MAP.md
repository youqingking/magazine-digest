# Target Repo Map

## Target Structure

```text
apps/
  mobile/                # Expo + React Native + TypeScript + Expo Router shell
packages/
  core-contracts/        # Canonical contracts, enums, schema ports, env contracts
  core-domain/           # Use cases, repositories, policy seams, event semantics
  core-ui/               # Design tokens, primitives, shared RN-facing UI contracts
infra/
  supabase/              # Supabase schema plan, functions seam, env/docs only for now
docs/                    # Governance, migration decisions, thread prompts, validation
scripts/
  validate/              # Repo-level preflight and migration validation entrypoints
```

## Ownership

### `apps/mobile`

- 未来唯一正式移动端主壳。
- 负责 Expo app config、Expo Router、providers、navigation shell、platform seams。
- 不直接承载后端 schema 定义。

### `packages/core-contracts`

- 未来 source of truth 合同层。
- 承接 `product_key`、内容、权益、定价、实验、事件、通知等跨端共享语义。
- 输出类型、枚举、schema ports、env contract。

### `packages/core-domain`

- 承接 use case、policy、service seam、repository contract。
- 消化 `backend/surfaces` 与 `shared/utils` 中可迁移的业务语义。
- 不直接承载具体 Supabase 凭据和 Expo 页面。

### `packages/core-ui`

- 只承接可复用 UI primitive、design token、theme contract、copy slot。
- 不复制 legacy `uni-app` 页面。

### `infra/supabase`

- 承接未来 Supabase 项目接线说明、表设计映射、edge seam、env seam。
- 本线程不创建 project、不写 SQL migration。

### `docs`

- 作为迁移期间唯一可信的规则层与审计层。
- 架构先写在这里，再落到实现线程。

### `scripts`

- 承接 repo-level preflight、validation、migration guard。
- 优先保持“可在无账号状态运行”的只读验证。

## Explicit Non-targets

- `mobile/` 不是目标主壳目录。
- `uniCloud/` 不是目标后端目录。
- `admin/` 不是当前线程要迁入的正式后台目录。
- `runtime/`、`output/`、`tmp/` 不是目标 repo map 的长期组成部分。
