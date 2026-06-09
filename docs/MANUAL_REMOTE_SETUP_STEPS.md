# Manual Remote Setup Steps

1. Fill remote runtime placeholders in root, mobile, and admin `.env` files.
2. Confirm intended runtime mode: `local`, `hybrid`, or `remote`.
3. Confirm the canonical uni-id paths inside the `mobile/` project:
   - `uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json`
   - `uniCloud/cloudfunctions/uni-id-co/`
   - `uniCloud/cloudfunctions/common/uni-id-common/`
   - if `uni-id-pages`, `uni-id-common`, and `uni-config-center` are installed under `uni_modules/`, reuse those bundled implementations; do not keep second project-level copies with the same names under `mobile/uniCloud-aliyun/`
4. Fill `passwordSecret` and `tokenSecret` in `mobile/uni_modules/uni-config-center/uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json` with local-only values. Never commit real secrets.
5. If a real uniCloud / uni-id space will be used later, record space id and auth provider, but keep H0.5 to the username/password validation path only.
6. If uni-push capability will be checked manually, record app id and obtain a test `cid`; keep it out of committed fixtures.
7. Open the Settings page and use the dev-safe `Auth test entry` plus push/device debug actions to verify:
   - username/password test prep
   - `uniCloud.getCurrentUserInfo()`
   - `getPushClientId`
   - `register-device` / `setPushCid`
8. Run `verify`, `validate:stage-h0`, `build:backend`, `build:admin`, `build:mobile`, and `smoke:stage-h0`.
9. Record any HBuilderX-only manual checks as `NEED_HUMAN` if desktop tooling is unavailable.
