# Stage DATA1A Pilot Field Map

| Target field | Source | Rule |
| --- | --- | --- |
| `publication_name` | fixed | `Reader's Digest` |
| `publication_key` | fixed | `readers_digest` |
| `issue_label` | fixed | `12112025` |
| `source_zip` | fixed | `Reader's Digest-12112025.zip` |
| `title` | 单篇 md `文章标题` | 取中文标题；优先文件内标题 |
| `original_title` | 单篇 md `文章标题` / 合并目录表 | 取非中文标题；文件内优先，目录表补齐 |
| `quick_30s` | 单篇 md | `成人版 - 短版` |
| `deep_3m` | 单篇 md | `成人版 - 长版` |
| `teen_quick_30s` | 单篇 md | `少年版 - 短版` |
| `teen_deep_3m` | 单篇 md | `少年版 - 长版` |
| `general_quick_30s` | adapter 派生 | `adult quick_30s` 映射，用于当前 runtime 兼容 |
| `general_deep_3m` | adapter 派生 | `adult deep_3m` 映射，用于当前 runtime 兼容 |
| `compliance_status` | 单篇 md | `合规状态` |
| `section_label` | 合并成人版大文件目录表 | 只做补齐，不做正文导入 |
| `start_page` | 合并成人版大文件目录表 | 只做补齐，不做正文导入 |
| `tags` | issue section + issue label | 当前最小化为 `section_label` 和 `issue:12112025` |
| `canonical_url` | missing | `null` |
| `cover` | missing | `null` |
| `author` | missing | `null` |
| `runtime_test_rule.free_quota_limit` | fixed runtime rule | `8` |
| `runtime_test_rule.derived_paywall_state` | adapter 派生 | 前 8 篇 `free`，其余 `preview_locked` |
