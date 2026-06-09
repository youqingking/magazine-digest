# Stage OPS4 Decisions

## Scope

- 建立 repo-local lightweight operator console。
- UI 只负责展示现有 report / registry / history，并触发已有脚本。
- 不新建独立 backend contract，不重写 OPS2 / OPS3 / TEST2。

## Console Form

- 采用本地 Node HTTP server + 静态页面。
- console 代码放在 `ops/console/`，不污染 mobile 用户端。
- server 放在 `scripts/ops/start-operator-console.mjs`。

## Operator Model

- 默认单用户 `local_op` 模式。
- 不接复杂登录，不做复杂 RBAC。
- 对 stateful 动作使用显式确认参数，并继续复用脚本本身的 lock / sandbox 保护。

## Reuse Policy

- 展示优先读取现有 JSON / markdown 产物。
- 动作只调用已有脚本：
  - compare
  - evaluate
  - dry-run publish
  - apply publish
  - rollback
  - retire
  - build release candidate
  - intake

## Non-goals

- 不做 full CMS。
- 不做复杂 analytics。
- 不做多组织后台。
- 不做远程服务部署。
