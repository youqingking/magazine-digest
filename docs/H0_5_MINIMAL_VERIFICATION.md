# H0.5 Minimal Verification

## Human prerequisites

- HBuilderX available for one real build
- Android test device available
- uni-id password login enabled in the target space
- one test username and password
- `DCLOUD_APP_ID`, `UNICLOUD_SPACE_ID`, `UNI_PUSH_APP_ID`, and `PRODUCT_KEY_DEFAULT` filled locally
- local-only `passwordSecret` and `tokenSecret` filled in `mobile/uni_modules/uni-config-center/uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json`

## HBuilderX checks

1. Open the `mobile/` project in HBuilderX.
2. Confirm the project is bound to the intended uniCloud space.
3. Confirm `uni-id-co` and `uni-id-common` are present under project `uniCloud`.
4. Confirm the password-login route or `uni-id-pages` module is available if password login will be tested through the official page.
5. Run the app on a real Android device.

## Automation entry points

- `npm run validate:h0_5-device-readiness`
- `npm run validate:stage-h0`
- `npm run smoke:h0_5-hbuilderx`
- `npm run smoke:h0_5-h5`
- `npm run smoke:h0_5-android`
- `npm run smoke:h0_5-android-ui`
- `npm run verify:h0_5-db`
- `npm run report:h0_5`

## Automation path overrides

- `H0_5_HBUILDERX_ROOT` or `HBUILDERX_CLI_PATH` can point to an HBuilderX install that contains `cli.exe`.
- `ADB_PATH` can point to a specific Android Debug Bridge executable.
- `H0_5_TEST_USERNAME` and `H0_5_TEST_PASSWORD` can drive the auto-login smoke path.

## Minimal verification order

1. Login
   - open `Settings -> Auth test entry`
   - fill username and password
   - open password login path or perform the manual password-login route
2. `getCurrentUserInfo`
   - return to `Auth test entry`
   - tap `Refresh current user`
   - confirm UID and basic counts are visible
3. `getPushClientId`
   - tap `Get push clientid`
   - confirm CID is present or explicitly missing
4. `register-device / setPushCid`
   - keep the app in logged-in state
   - tap `Register device` or `Register device with cid`
   - confirm registration state and source are visible
5. Check tables
   - inspect `opendb-device`
   - inspect `uni-id-device`

## Expected visible outputs

- auth state
- `uniCloud.getCurrentUserInfo()` state and UID
- push client id presence
- device registration state
- signout entry remains available

## Out of scope

- payment provider
- mass push
- full account center
