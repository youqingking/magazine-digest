# Remote Environment Checklist

## Local dev

- local fixtures exported
- `RUNTIME_MODE=local`
- no remote secret required

## Remote foundation

- remote runtime base url placeholder configured
- remote project id fixed as `magazine-digest-dev`
- uni-app manifest app id fixed as `__UNI__005A993`
- AliCloud space id recorded as `mp-c6fe68c6-7c54-45f6-a5e0-5b4ec1bbc2a0`
- auth provider default remains `uni-id`

## H0 minimal gaps to reach real-connect

- canonical `uni-id` paths are fixed relative to the `mobile/` project root as `uniCloud/cloudfunctions/common/uni-config-center/uni-id/config.json`, `uniCloud/cloudfunctions/uni-id-co/`, and `uniCloud/cloudfunctions/common/uni-id-common/`
- `NEED_HUMAN`: confirm whether remote runtime `app_id` should reuse `__UNI__005A993` or use a separate identifier
- `NEED_HUMAN`: confirm target `uni-id` scheme, enabled login methods, and available test account / SMS verification path
- `NEED_HUMAN`: provide local `ALICLOUD_CLIENT_SECRET` outside git only, then verify it has not been exposed elsewhere
- `NEED_HUMAN`: confirm whether default runtime mode should stay `hybrid` or switch to `remote`
- `NEED_HUMAN`: confirm whether `uni-push` is enabled and provide push `appid`
- `NEED_HUMAN`: provide one real test device `cid` / `clientid`
- `NEED_HUMAN`: confirm HBuilderX availability for one real build and whether an Android test device is ready

## Minimal input preparation

- Human must fill: `REMOTE_PROJECT_ID`, `UNICLOUD_SPACE_ID`, `DCLOUD_APP_ID`, `UNI_PUSH_APP_ID`, `PRODUCT_KEY_DEFAULT`, and local-only `passwordSecret` / `tokenSecret`
- Human must provide when true-device validation begins: `PUSH_CLIENT_ID`
- Can stay blank during H0.5 prep: `REMOTE_RUNTIME_BASE_URL` when the seam still uses client SDK or cloud object calls
- Can stay at default: `REMOTE_RUNTIME_MODE=hybrid`, `UNI_ID_ENABLED=true`, `UNI_PUSH_ENABLED=true`
- Admin visibility only needs read-only copies of the same values; no extra admin-only secret is required in H0.5

## Payment-ready later

- payment provider keys
- order callbacks
- subscription settlement
- entitlement grant automation
