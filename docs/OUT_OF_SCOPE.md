# Out Of Scope

## This Thread

- 不执行 `create-expo-app`
- 不写实际页面
- 不写业务逻辑
- 不创建 Supabase project
- 不写 SQL migrations
- 不接入 RevenueCat
- 不接入 push notifications
- 不移动或删除 legacy 代码
- 不重命名现有关键目录，除非后续明确列入 `NEED_HUMAN`

## Repo Boundary

- 不实现 `PDF / web / prompt -> markdown` 内容生产流水线
- 不在 App 仓库里做 PDF 解析
- 不在 App 仓库里做网页抓取
- 不在 App 仓库里做 Prompt 生成
- 不在 App 仓库里做 Markdown 生产
- 不在 App 仓库里做外部内容流水线调度

## Migration Rule

- `mobile/`、`uniCloud/`、`admin/` 当前只作为 migration reference。
- 未来正式实现只进入 `apps/mobile`、`packages/core-*`、`infra/supabase`。
