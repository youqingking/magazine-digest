# Stage REL2 Fallback Policy

## Fallback Order

1. primary: `remote_channel_head`
2. first fallback: local `channel_head`
3. second fallback: local `current_mirror`
4. final failure: 显式抛出 runtime source error

## Fallback-worthy Errors

以下错误允许 fallback：

- `REMOTE_CHANNEL_MANIFEST_FETCH_FAILED`
- `REMOTE_CHANNEL_MANIFEST_INVALID`
- `REMOTE_RELEASE_FETCH_FAILED`
- `REMOTE_RELEASE_BUNDLE_INVALID`
- `REMOTE_RELEASE_NOT_FOUND`

## Fail-fast Errors

以下情况不做静默兜底，必须直接报错并记录事件：

- runtime source mode 配置非法
- 缺少 channel / remote base url 等必要参数
- preview-only scenario 被错误映射到 production channel
- product key / release provenance 不匹配且无法解释

## Observability Requirements

每次 remote-like resolve/fetch/fallback 必须至少记录：

- `remote_channel_resolved`
- `remote_channel_fetch_failed`
- `remote_release_loaded`
- `remote_fallback_applied`

## Operator Expectations

- fallback 后可在 triage dashboard 与 operator console 看见最近失败与回退目标
- fallback 只是运行态保护，不替代 publish/rollback/closeout
