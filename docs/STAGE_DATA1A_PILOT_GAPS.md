# Stage DATA1A Pilot Gaps

## Current Gaps Between Real MD And Runtime Contract

1. 单篇 md 没有 frontmatter  
当前 contract 习惯吃结构化 variant 记录；pilot 通过正文标签 parser 解决，不改 schema。

2. 源数据没有 `general` audience 变体  
当前 detail 默认 audience 是 `general`；pilot 用 adapter 派生 `general_*`，避免 detail 默认打开即 unavailable。

3. section / start_page 不在单篇 md 里  
由合并成人版大文件目录表补齐；不把该大文件导入为文章。

4. `cover / author / canonical_url` 缺失  
当前页面侧优雅降级为 `null`，不新增必填字段。

5. 文件名与目录表标题存在轻微不一致  
如 `In Focus -` vs `In Focus:`；按“文件内标题 > 目录表 > 文件名”解析，并记录 warning。

## Adapter Can Solve

- `general` 兼容派生
- section/start_page 补齐
- summary 截断
- runtime paywall test rule 投影
- publication/follow/search facet 最小映射

## Not Solved In Pilot

- 不做跨刊物泛化 normalizer
- 不做完整 author/cover/canonical_url 回填
- 不做正式商业权限判定
- 不做 backend/admin 内容发布流
