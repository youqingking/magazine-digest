# Validation Matrix

## Thread 2 Minimum Validation

| Check | Purpose | Expected evidence | Suggested command |
| --- | --- | --- | --- |
| Expo app scaffold | 确认 `apps/mobile` 已由官方模板落地 | `apps/mobile/package.json`、`app.json`/`app.config.*`、`tsconfig.json` 存在 | `pnpm --dir apps/mobile exec expo config --json` |
| Expo Router route skeleton | 确认路由骨架存在且不再依赖 `pages.json` | `app/` 或 `src/app/` 下存在路由入口与 layout | `pnpm --dir apps/mobile exec expo-router doctor` 或静态路径检查 |
| typecheck / lint 占位 | 确认根工作区可声明质量门禁 | root 与 `apps/mobile` 存在 `typecheck` / `lint` 占位脚本 | `pnpm typecheck` 与 `pnpm lint` |
| Android dev build path | 确认 Android-first 路径被写入脚本或 README | `apps/mobile/README.md` 或脚本中存在 dev build / runbook | `pnpm --dir apps/mobile exec expo prebuild --platform android --no-install` 或等价只读验证 |
| Supabase env seam | 确认不写死 URL / anon key | `packages/core-contracts` 或 `apps/mobile` 中存在 env contract 与示例值占位 | `pnpm validate:preflight` |
| RevenueCat seam 占位 | 确认只有 seam，没有真实接入 | 常量、provider 或 adapter 接口存在，但无真实 API key | `pnpm validate:preflight` |
| notifications seam 占位 | 确认只有 seam，没有真实推送注册 | push adapter / capability contract 存在，但无真实 token 注册 | `pnpm validate:preflight` |

## Acceptance Notes

- 第二线程可以真正执行 `create-expo-app`。
- 第二线程仍然不能创建真实 Supabase project。
- 第二线程仍然不能接入真实 RevenueCat。
- 第二线程仍然不能接入真实 push notifications。
- 所有验证都应优先使用本地可运行、无需凭据的命令。
