# H1a uni-pay Example Runbook

## Rule

- The example project must run successfully before the main project starts H1b real payment integration.
- Do not import example source into this repo during H1a.
- Primary route for this repo: [uni-pay](https://doc.dcloud.net.cn/uniCloud/uni-pay/uni-app.html)
- Fallback migration reference only: [uni-pay-x](https://doc.dcloud.net.cn/uniCloud/uni-pay/uni-app-x.html)

## Why Example-First Is Mandatory

- DCloud's official guidance says to run the example project first, because a successful example proves the configuration and certificates are correct before integrating into your own project.
- This is a hard precondition for H1b in this repo.

## Primary Runbook For This Repo (`uni-app` -> `uni-pay`)

1. Import the official `uni-pay` example project from the DCloud plugin market into a separate workspace, not this repo.
2. Open the example in HBuilderX and bind it to the intended uniCloud service space.
3. Edit the example payment config first: `uniCloud/cloudfunctions/common/uni-config-center/uni-pay/config.js`.
4. Fill only merchant-owned values in that example config. Do not invent placeholders that look real.
5. Upload common module `uni-config-center`.
6. Upload common module `uni-pay`.
7. Upload cloud object `uni-pay-co`.
8. Initialize the example database tables from the example project's `database` directory.
9. Confirm provider-side callback URLs point at the deployed example `uni-pay-co` endpoint, not the main project.
10. Run the example's payment UI on the real target client type for H1b, which is Android App first.
11. Verify async callback handling in the example environment.
12. Record evidence outside the repo: provider chosen, service space id, callback URL, cert set used, operator, test timestamp, and outcome.

## What To Edit First

| Order | Artifact | Purpose |
| --- | --- | --- |
| 1 | `uniCloud/cloudfunctions/common/uni-config-center/uni-pay/config.js` | all merchant/provider configuration starts here |
| 2 | provider cert/key files referenced by `config.js` | remove path mismatches early |
| 3 | service-space callback URL mapping under `notifyUrl` | make async callback testable |

## What To Upload First

| Order | Artifact | Why |
| --- | --- | --- |
| 1 | `uni-config-center` common module | payment config changes do not take effect until re-uploaded |
| 2 | `uni-pay` common module | core server payment logic dependency |
| 3 | `uni-pay-co` cloud object | callback and order orchestration entry |

## Database Initialization Checklist

- initialize all payment-related example tables from the example project's `database` directory
- confirm order-related and callback-related tables exist before smoke
- do not point example validation at the main project's Stage B fact tables

## Example Success Criteria

- the example app can present the payment entry UI for the chosen provider set
- the example can create a provider-facing payment attempt using real merchant configuration
- the provider can reach the configured `notifyUrl` callback target
- the example's callback processing completes without certificate or signature errors
- replaying or re-querying the example order does not produce ambiguous status
- every success artifact is tied to the separate example workspace, not to this repo

## Failure Handling

- if config upload succeeds but provider callback fails, stop and fix merchant/cert/callback inputs in the example first
- if provider SDK can launch but callback cannot be verified, H1b remains blocked
- if test and prod credentials are mixed, discard the run and repeat with clean separation

## Migration-Only Reference For `uni-app x`

- If the client is later rebuilt as `uni-app x`, switch to the official `uni-pay-x` example.
- The import order remains the same:
  1. import `uni-pay-x` example
  2. edit `uniCloud/cloudfunctions/common/uni-config-center/uni-pay/config.js`
  3. upload `uni-config-center`
  4. upload `uni-pay`
  5. upload `uni-pay-co`
  6. initialize the example database
- In that route, future page reservation would use `uni_modules/uni-pay-x/pages/...` instead of `uni_modules/uni-pay/pages/...`.

## H1b Gate From This Runbook

- H1b may start only after the example project has been verified with the chosen provider set and the final merchant inputs are owned.
- If the example has not run end to end, H1b must stay `NO`.
