# H1a Payment Provider Decision

## Stage Intent

- Stage H1a is readiness only.
- This stage fixes the payment plugin route, input inventory, and example-first validation path.
- This stage does not implement real `billing.createOrder`, `billing.confirmOrder`, `billing.handleWebhook`, or entitlement grant in the main project.

## Project Type Verdict

- Detected project type: `uni-app`
- Fixed plugin route for this repo: `uni-pay`
- Deferred migration-only fallback: if a future repo rewrite moves the client to `uni-app x`, switch the payment route to `uni-pay-x`

## Evidence

| Evidence | Current repo state | Decision impact |
| --- | --- | --- |
| App entry file | `mobile/App.vue` exists | Matches `uni-app` project structure |
| Main entry file | `mobile/main.js` exists | Matches `uni-app` project structure |
| Page registry | `mobile/pages.json` uses standard `pages` format | Matches `uni-app` project structure |
| Manifest | `mobile/manifest.json` is standard `uni-app` app manifest | No `uni-app x`-only entrypoint detected |
| Compiled manifest | `mobile/unpackage/dist/dev/app-plus/manifest.json` includes `useragent.value = "uni-app"` | Confirms compiled target is `uni-app` |
| Local source scan | No top-level `App.uvue`, `main.uts`, or app-owned `pages/**/*.uvue` detected outside `uni_modules` | No app-owned `uni-app x` markers |

## Official Plugin Mapping

- `uni-app` client -> use [uni-pay](https://doc.dcloud.net.cn/uniCloud/uni-pay/uni-app.html)
- `uni-app x` client -> use [uni-pay-x](https://doc.dcloud.net.cn/uniCloud/uni-pay/uni-app-x.html)
- DCloud states that `uni-pay-x` is the `uni-app x` edition and its doc applies only when the client is `uni-app x`.

## Provider Scope Inside The Chosen Route

- Provider choice is not frozen in H1a.
- H1a supports three business options for later manual selection:
  - `wxpay` App payment only
  - `alipay` App payment only
  - both `wxpay` and `alipay` App payment
- The plugin route stays `uni-pay` regardless of whether one or both providers are enabled.

## H1b Consequence

- H1b must integrate `uni-pay`, not `uni-pay-x`.
- H1b should copy the validated example project's `uniCloud/cloudfunctions/common/uni-config-center/uni-pay/config.js` baseline into the main project only after the example runbook is closed.
- If the app is later rebuilt as true `uni-app x`, do not patch around it inside H1b. Re-open the route decision and migrate to `uni-pay-x` explicitly.
