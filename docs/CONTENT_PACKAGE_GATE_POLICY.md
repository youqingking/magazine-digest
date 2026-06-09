# Content Package Gate Policy

## 目标

内容包在进入 registry / scenario / current 之前，必须先通过导入门禁。

这条门禁的原则是：

- 宁可阻止导入，也不要把明显错误内容放进 app
- 宁可隐藏不合格文章，也不要让用户看到标题、摘要、正文互相对不上的内容
- intake 成功不代表只做了文件搬运；它同时负责最低质量门槛校验

## 当前门禁覆盖的导入路线

- `content_batch`
- `content_pack`
- `generic_split_release`

对应入口：

- [intake-pack.mjs](/D:/ws/Playground/scripts/ops/intake-pack.mjs)
- [import-content-batch.mjs](/D:/ws/Playground/scripts/import/import-content-batch.mjs)
- [import-content-pack.mjs](/D:/ws/Playground/scripts/import/import-content-pack.mjs)
- [import-generic-split-release.mjs](/D:/ws/Playground/scripts/import/import-generic-split-release.mjs)

## 记录级必填要求

单篇文章至少必须具备：

- `article_id`
- `article_uid`
- `title`
- `summary`
- `quick_30s`
- `deep_3m`
- `teen_quick_30s`
- `teen_deep_3m`
- `general_quick_30s`
- `general_deep_3m`

当前规则还要求：

- `title` 不能是明显占位值
- `summary` 不能过短
- `quick_30s` / `deep_3m` 不能过短
- 成人版、青少年版、通用版都必须同时成立

## 包级阻断条件

以下情况会直接阻止导入：

- adult 文件没有对应 youth 配对
- TOC / 文件标题冲突
- 缺少必要 variant
- `article_id` 重复
- parser 已经识别出成人版 / 青少年版内容不完整
- adult / youth 标题不一致
- adult / youth 原标题不一致
- merged 标题与解析标题不一致
- `summary` 与 `quick_30s` 前缀不一致，疑似标题/摘要/正文串位

## 导入失败时的行为

导入失败时：

- 不写入 publication / issue / scenario registry
- 不允许把不达标内容进入 current / candidate
- operator console 会收到结构化 blocker JSON
- 当前 importer 会尽量清理已产生的 issue root / scenario bundle，避免留下半截导入结果

## 运行时兜底

除了导入期硬门禁，runtime bundle 构建也会再做一次 publishable 过滤：

- 不合格记录不会进入 `discoveryCatalog`
- 不合格记录不会进入 `contentSyncDelta`
- 不合格记录不会进入 `contentDetail`

也就是说，即使本地目录里残留了问题记录，运行时也应尽量不把它展示给用户。

## 后台反馈

当上传 zip 未通过门禁时，后台应返回：

- `status = blocked`
- `error_code = CONTENT_PACKAGE_GATE_BLOCKED`
- `validation_report`

`validation_report` 中至少包含：

- `package_level_blockers`
- `blocked_records`
- `blocked_record_count`
- `blocker_count`

## 运营处理建议

看到 `blocked` 后，不要继续强行纳入 candidate 或发布。

优先检查：

- zip 内文件是否成对
- 标题是否对齐
- summary 是否和 30 秒正文一致
- 成人版 / 青少年版 / 长短版是否齐全

## 相关文件

- [content-package-gate.mjs](/D:/ws/Playground/scripts/import/lib/content-package-gate.mjs)
- [runtime-bundle-builder.mjs](/D:/ws/Playground/scripts/import/lib/runtime-bundle-builder.mjs)
