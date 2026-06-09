# H0.5 Minimal Input Preparation

## Scope

- additive only
- no payment provider
- no full auth center
- no full push console
- no contract rewrite

## Human-provided values

- `REMOTE_PROJECT_ID`
- `UNICLOUD_SPACE_ID`
- `DCLOUD_APP_ID`
- `PRODUCT_KEY_DEFAULT`
- `UNI_PUSH_APP_ID`
- `PUSH_CLIENT_ID` for a real device run
- `H0_5_TEST_USERNAME`
- `H0_5_TEST_PASSWORD`
- local-only `passwordSecret`
- local-only `tokenSecret`
- username and password for the test account if password login is enabled

## Values that may stay blank in H0.5

- `REMOTE_RUNTIME_BASE_URL` when the app still uses uniCloud client SDK or cloud object access
- admin read-only copies of push cid when no admin-side runtime check is needed

## Mobile entry points prepared in this stage

- Settings page:
  - `Auth test entry`
  - `Refresh current user`
  - `Get push clientid`
  - `Register device`
  - `Register device with cid`
- Auth test page:
  - username/password test input
  - `uniCloud.getCurrentUserInfo()` visibility
  - signout entry
  - push cid and device registration hook

## Canonical uni-id paths inside the mobile project

- `uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json`
- `uniCloud/cloudfunctions/uni-id-co/`
- `uniCloud/cloudfunctions/common/uni-id-common/`

## Notes

- `uni-id-pages` username/password routing is prepared as a manual handoff path and may still require the official module to be installed in HBuilderX.
- In logged-in state, device registration now prefers `uni-id-co.setPushCid` so `opendb-device` and `uni-id-device` can be checked in the bound uniCloud space.
- H0.5 automation can use `H0_5_HBUILDERX_ROOT` or `HBUILDERX_CLI_PATH` to resolve `cli.exe` and trigger an Android compile-only smoke.
- Local automation can disable password-login captcha via `uni-id` config `automation.disablePasswordLoginCaptcha`.
- Android automation can use `ADB_PATH`; database verification can use `H0_5_DB_VERIFY_COMMAND` to return a JSON result for `opendb-device` and `uni-id-device`.
- Real secrets must stay local only and must not be committed.
