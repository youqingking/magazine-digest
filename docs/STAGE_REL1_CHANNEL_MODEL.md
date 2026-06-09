# Stage REL1 Channel Model

## Roles

- `baseline`
  - 已知可恢复基线 scenario，当前仍为 `data1a_readers_digest_12112025`
- `candidate`
  - 通过 OPS2/DATA2 evaluation 的 scenario
- `release artifact`
  - 由 candidate 构建出的不可变目录
- `channel head`
  - 某个 channel 当前指向的 release manifest

## Local Layout

- `runtime/releases/<release-id>/bundle.json`
- `runtime/releases/<release-id>/manifest.json`
- `runtime/releases/<release-id>/notes.md`
- `runtime/releases/<release-id>/provenance.json`
- `runtime/channels/dev/manifest.json`
- `runtime/channels/staging/manifest.json`
- `runtime/channels/production/manifest.json`
- `runtime/channels/<channel>/history.json`

## Rules

- build release artifact 前必须先过 OPS2 promotion decision。
- channel publish 默认 dry-run。
- channel head 更新必须 atomic。
- channel rollback 只基于该 channel 历史，不重新猜测 scenario。
- production 不允许接收 preview-only scenario，也不允许绕过 `promotable` 门槛。
