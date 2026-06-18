## 全局准备与总体验证

| 目的 | 命令 | 说明 |
| --- | --- | --- |
| 安装依赖 | `npm install` | 使用根目录 `package-lock.json` 安装 Node 依赖。 |
| 仓库安装引导 | `npm run install` | 执行 `scripts/bootstrap/install.ps1`，属于项目自带 bootstrap 脚本。 |
| 基础预检 | `npm run preflight` | 执行 `scripts/harness/preflight.ps1`。 |
| 验证预检脚本 | `npm run validate:preflight` | PowerShell 版 preflight 验证。 |
| POSIX 预检验证 | `npm run validate:preflight:sh` | `sh ./scripts/validate/preflight.sh`，需要可用的 `sh` 环境。 |
| 主验证链路 | `npm run verify` | 运行 harness verify，并继续执行 Stage B contract 校验。 |
| 主 smoke 链路 | `npm run smoke` | 运行 Stage C smoke。 |
| 测试输入构建 | `npm run build:test-inputs` | 生成 synthetic test pack。 |
| 测试输入校验 | `npm run validate:test-inputs` | 校验 synthetic test pack。 |
| 测试输入 smoke | `npm run smoke:test-inputs` | 对 synthetic test pack 做 smoke。 |

## 应用与运行命令

| 应用/入口 | 运行命令 | 测试/验证命令 | 备注 |
| --- | --- | --- | --- |
| Root Static Preview | `powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8080` | `npm run preflight`; `npm run verify`; `npm run smoke` | 打开 `http://localhost:8080/`。入口文件为根目录 `index.html`，配套 `app.js`、`snake-logic.js`、`styles.css`。 |
| Admin Static Shell | `npm run generate-admin`; `npm run build:admin`; `cd admin`; `powershell -ExecutionPolicy Bypass -File ..\serve.ps1 -Port 8081` | 根目录：`npm run generate-admin`; `npm run build:admin`。`admin/` 目录内：`npm run generate:pages`; `npm run build:shell` | 打开 `http://localhost:8081/`。`admin/package.json` 只提供生成与构建脚本，静态预览仍复用根目录 `serve.ps1`。 |
| Legacy Mobile Shell | 在 HBuilderX 中打开 `mobile/` 后运行 H5 或 Android 目标 | `npm run build:mobile`; `npm run smoke:stage-ui35-h5`; `npm run smoke:h0_5-h5`; `npm run smoke:h0_5-hbuilderx`; `npm run smoke:h0_5-android`; `npm run smoke:h0_5-android-ui`; `npm run verify:h0_5-db`; `npm run report:h0_5` | `mobile/package.json` 提供 `npm run build:shell`，等价于调用根目录 mobile build 脚本。真实 uni-app 编译/设备运行需要本机 HBuilderX 或对应移动端环境。 |
| Backend Fixture Runtime | `node .\backend\cli.mjs` | `npm run build:backend`; `node .\backend\cli.mjs` | 当前 backend 是 fixture/smoke runtime，不是常驻 HTTP 服务。CLI 会生成/刷新 `output/stage-d/backend-smoke.json`。 |
| Operator Console | `node .\scripts\ops\start-operator-console.mjs` | `npm run smoke:stage-ops5`; `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap\smoke-stage-ops4.ps1`; `node .\scripts\bootstrap\smoke-stage-ops5.mjs` | 默认打开 `http://127.0.0.1:4174/`。支持 `--port`、`--host`、`--base-path`、`--runtime-base-path`、`--default-remote-base-url`。 |
| Runtime Dist Probe | `node .\scripts\ops\serve-runtime-dist.mjs` | `npm run smoke:stage-ops5`; `powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap\smoke-stage-rel2.ps1` | 支撑 ops/release 验证的 runtime dist 服务/探针；默认端口以脚本内配置为准，可通过参数覆盖。 |

## Stage 与专项验证脚本

| 阶段/目标 | 命令 |
| --- | --- |
| Stage H0 contract | `npm run validate:stage-h0` |
| H0.5 device readiness | `npm run validate:h0_5-device-readiness` |
| F1 foundation | `npm run validate:f1-foundation` |
| Stage G contract | `npm run validate:stage-g` |
| Stage D smoke | `npm run smoke:stage-d` |
| OPS5 smoke | `npm run smoke:stage-ops5` |
| E0 smoke | `npm run smoke:stage-e0` |
| F1 smoke | `npm run smoke:stage-f1` |
| Stage G smoke | `npm run smoke:stage-g` |
| H0 smoke | `npm run smoke:stage-h0` |
| UI35 H5 smoke | `npm run smoke:stage-ui35-h5` |
| H0.5 H5 smoke | `npm run smoke:h0_5-h5` |
| H0.5 HBuilderX smoke | `npm run smoke:h0_5-hbuilderx` |
| H0.5 Android smoke | `npm run smoke:h0_5-android` |
| H0.5 Android UI smoke | `npm run smoke:h0_5-android-ui` |
| H0.5 DB verify | `npm run verify:h0_5-db` |
| H0.5 report | `npm run report:h0_5` |

## 非独立应用目录

| 目录 | 结论 | 验证方式 |
| --- | --- | --- |
| `domains/magazine-domain` | 领域投影/库包，`package.json` 没有 scripts。 | 通过根目录 `npm run verify`、`npm run smoke` 或使用方脚本间接验证。 |
| `domains/podcast-domain` | 领域投影/库包，`package.json` 没有 scripts。 | 通过根目录验证链路间接验证。 |
| `domains/youtube-domain` | 领域投影/库包，`package.json` 没有 scripts。 | 通过根目录验证链路间接验证。 |
| `packages/*` | workspace library/harness 包，当前未发现独立 run/test scripts。 | 通过根目录 scripts、contracts、smoke 链路验证。 |
| `mobile/uni_modules/*` | uni-app 插件/模块目录，不作为仓库的一等应用单独启动。 | 通过 mobile build/smoke 或 HBuilderX 验证。 |

## Expo 目标状态

根目录存在 `app.json`、`eas.json` 等 Expo/EAS 目标配置，但当前分支未发现完整的 `apps/mobile` Expo Router 应用壳。因此不要把 `npx expo start` 当作当前分支的可靠启动命令；如果需要恢复 Expo 应用，应先补齐对应应用目录与 package scripts，再更新本文。

## 建议的快速验证顺序

```powershell
npm run preflight
npm run build:backend
npm run generate-admin
npm run build:admin
npm run build:mobile
npm run verify
npm run smoke
```

## NEED_HUMAN

- `mobile/` 的真实 H5/Android 运行依赖 HBuilderX、模拟器或真机环境，纯 CLI 只能覆盖项目内已有 build/smoke 脚本。
- Playwright smoke 需要本机已安装可用浏览器与依赖；缺失时需要先安装对应 Playwright browser。
- 部分 preflight/发布相关脚本会检查环境变量，例如 `ALICLOUD_SPACE_ID`、`ALICLOUD_CLIENT_SECRET`、`UNI_ADMIN_BASE_URL`、`PUSH_APP_KEY`、`PRODUCT_KEY_DEFAULT`。
- 涉及发布、apply、sync 的 ops 脚本可能会改变外部状态；默认优先使用 smoke、probe 或 dry-run 路径。