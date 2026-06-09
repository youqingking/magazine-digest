# H1a Merchant Inputs

## Purpose

- Freeze the manual input checklist required before any real payment wiring.
- Keep names as close as practical to the `uni-pay` `config.js` structure.
- Do not place real values in this repo.

## Provider Selection Checklist

| Item | Allowed value | Required for H1b | Source |
| --- | --- | --- | --- |
| `provider_scope` | `wxpay-app` / `alipay-app` / `wxpay-app+alipay-app` | Yes | NEED_HUMAN |
| `client_channel_map.app` | `app` | Yes | Repo + NEED_HUMAN confirmation |
| `client_channel_map.product_key` | current repo `product_key` | Yes | Repo-derived |
| `client_channel_map.pricing_plan_id -> provider goods mapping` | documented mapping only | Yes | NEED_HUMAN |

## Config-Aligned Input Matrix

### Unified Config Inputs

| Config area | Field | Meaning | Required | Source |
| --- | --- | --- | --- | --- |
| `notifyUrl` | service-space to callback URL map | provider async callback URL map | Yes | NEED_HUMAN for domain + space id |
| `notifyUrl` | test space entry | test callback URL | Yes if test is used | NEED_HUMAN |
| `notifyUrl` | prod space entry | prod callback URL | Yes | NEED_HUMAN |
| `returnUrl` | optional browser/app return target | only if chosen flow needs it | Maybe | NEED_HUMAN |
| environment split | `test` / `prod` | credential separation | Yes | NEED_HUMAN |
| ownership | `endpoint_owner` | who owns callback deployment | Yes | NEED_HUMAN |
| ownership | `retry_owner` | who handles replay and provider retries | Yes | NEED_HUMAN |
| ownership | `cert_rotation_owner` | who rotates certificates and keys | Yes | NEED_HUMAN |

### WeChat App Payment Inputs

| Config area | Field | Meaning | Required | Source |
| --- | --- | --- | --- | --- |
| `wxpay.app` | `appId` | App open platform app id | Yes if `wxpay` chosen | NEED_HUMAN |
| `wxpay.app` | `mchId` | merchant id | Yes if `wxpay` chosen | NEED_HUMAN |
| `wxpay.app` | `secret` | app secret if required by chosen flow | Maybe | NEED_HUMAN |
| `wxpay.app` | `version` | `2` or `3` | Yes if `wxpay` chosen | NEED_HUMAN |
| `wxpay.app` | `key` | v2 api key | Yes for v2 only | NEED_HUMAN |
| `wxpay.app` | `pfx` | v2 merchant certificate | Yes for v2 only | NEED_HUMAN |
| `wxpay.app` | `v3Key` | v3 api key | Yes for v3 only | NEED_HUMAN |
| `wxpay.app` | `appCertPath` | v3 merchant cert path | Yes for v3 only | NEED_HUMAN |
| `wxpay.app` | `appPrivateKeyPath` | v3 merchant private key path | Yes for v3 only | NEED_HUMAN |
| `wxpay.app` | `wxpayPublicKeyPath` | WeChat pay public key path if enabled | Maybe | NEED_HUMAN |
| `wxpay.app` | `wxpayPublicKeyId` | WeChat pay public key id | Maybe | NEED_HUMAN |

### Alipay App Payment Inputs

| Config area | Field | Meaning | Required | Source |
| --- | --- | --- | --- | --- |
| `alipay.app` | `appId` | Alipay open platform app id | Yes if `alipay` chosen | NEED_HUMAN |
| `alipay.app` | `privateKey` | merchant PKCS8 private key | Yes if `alipay` chosen | NEED_HUMAN |
| `alipay.app` | `appCertPath` | merchant public cert path | Yes for cert mode | NEED_HUMAN |
| `alipay.app` | `alipayPublicCertPath` | Alipay public cert path | Yes for cert mode | NEED_HUMAN |
| `alipay.app` | `alipayRootCertPath` | Alipay root cert path | Yes for cert mode | NEED_HUMAN |
| `alipay.app` | `alipayPublicKey` | Alipay public key string if key mode is used | Maybe | NEED_HUMAN |
| `alipay.app` | `sandbox` | sandbox toggle | Yes for test planning | NEED_HUMAN |

## Webhook And Callback Checklist

| Input | Why it matters | Required | Source |
| --- | --- | --- | --- |
| callback base domain | provider must reach the deployed callback endpoint | Yes | NEED_HUMAN |
| deployed `uni-pay-co` endpoint URL | ties provider callback to the sample or future project | Yes | NEED_HUMAN |
| verification secret or signing material owner | audit and replay handling ownership | Yes | NEED_HUMAN |
| provider retry handling owner | failed delivery escalation | Yes | NEED_HUMAN |
| monitoring owner | payment failure detection | Yes | NEED_HUMAN |

## Repo-Derivable Inputs

| Item | How derived |
| --- | --- |
| `product_key` presence | from frozen Stage B and later contracts |
| canonical settlement unit | `fen`, `price_multiplier_basis_points`, `vip_days`, `Asia/Shanghai` from Stage B frozen docs |
| target client family | current repo is `uni-app` |
| target plugin route | `uni-pay` |
| future main-project integration seams | from Stage B billing contracts and current mobile/backend structure |
| planned success-page reservation | from `pages.json` planning only, not implemented in H1a |

## Manual-Only Inputs

- real provider enablement choice
- real merchant ids and app ids
- all certs, private keys, public certs, api keys, and webhook secrets
- test/prod service space ids
- callback domain ownership and DNS / deployment ownership
- merchant compliance confirmation for Android App payment

## H1a Exit Rule

- H1a can close only when this checklist is documented and reviewed.
- H1b cannot start real payment integration until every required NEED_HUMAN field above has an explicit owner and non-placeholder value outside this repo.
