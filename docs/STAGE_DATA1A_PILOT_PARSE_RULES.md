# Stage DATA1A Pilot Parse Rules

## Single Article MD

每篇单篇 md 直接按正文标签解析：

1. `文章标题`
2. `合规状态`
3. `成人版 - 短版`
4. `成人版 - 长版`
5. `少年版 - 短版`
6. `少年版 - 长版`

## Extraction Rules

- `文章标题`
  - 先读整行文本
  - 如果有 `/`，优先把含中文的一侧作为 `title`
  - 非中文的一侧作为 `original_title`
  - 如果文件内无法稳定拆出原题，再用目录表 `section_english_title` 补齐
- `合规状态`
  - 取标签行原文
- 四个正文块
  - 从对应标签开始，截取到下一个已知标签前
  - 保留 markdown 正文，不做再生成

## Adult Merged File

- 只读取 `---` 之前的目录表
- 目录表字段：
  - `板块 (Section)`
  - `英文标题 (English Title)`
  - `中文标题 (Chinese Title)`
  - `起始页码`
- 用途仅限：
  - `section_label`
  - `start_page`
  - `title` / `original_title` 的补齐与冲突校验

## Priority When Conflicts Exist

1. 文件内 `文章标题`
2. 合并大文件目录表标题
3. 文件名

## Known Tolerance Rules

- 文件名编码或标点轻微异常不阻塞导入
- `In Focus -` / `In Focus:` 这类标点差异记 warning，不视为失败
- 合并成人版大文件永远不进入 article catalog
