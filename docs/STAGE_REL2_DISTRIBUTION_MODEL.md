# Stage REL2 Distribution Model

## Source Of Truth

- release source of truth：`runtime/releases/<release-id>/`
- channel source of truth：`runtime/channels/<channel>/manifest.json`
- runtime source selector：`mobile/fixtures/runtime/runtime-source.json`

REL2 不直接复用上述目录作为 app 对外读取目录，而是导出到独立 dist 层。

## Dist Layout

```text
runtime/dist/
  index.json
  channels/
    dev/manifest.json
    staging/manifest.json
    production/manifest.json
  releases/
    <release-id>/
      manifest.json
      bundle.json
      provenance.json
```

## Channel Manifest Contract

每个 channel manifest 至少包含：

- `channel`
- `release_id`
- `release_manifest_path`
- `bundle_path`
- `exported_at`
- `notes`
- `version`
- `source_manifest`

## Release Manifest Contract

每个 release manifest 至少包含：

- `release_id`
- `scenario_id`
- `channel`
- `product_key`
- `bundle_path`
- `generated_at`
- `provenance`
- `artifact_version`

## Export Semantics

- release export 为 immutable copy，不回写 release source of truth
- channel export 可随 publish/rollback 更新 head
- export 为 repeatable build；同一输入应产生同一可解释结构
- dist index 汇总当前可用 release、channel head、最近导出时间

## Hosting Alignment

本地 serve 与未来远程托管的对齐方式：

- 本地：`http://127.0.0.1:<port>/index.json`
- 未来静态托管：`https://<host>/runtime/index.json`

app 只依赖静态路径与 JSON 合同，不依赖本地文件系统路径。
