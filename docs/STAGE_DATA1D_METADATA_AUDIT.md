# Stage DATA1D Metadata Audit

## Current Quality Focus

- `readers_digest__12112025`：结构稳定，当前仅保留 baseline，不作为本阶段主要提质对象。
- `barrons__09022026`：pairing 稳定，registry 和 display name 质量已基本达标。
- `the_atlantic__012026`：主要问题是文件名截断与 merged excerpt 泄漏为 section label，直接影响 feed/search 可读性。
- `the_economist__20260314`：主要问题是 section_label 依赖弱 fallback，导致 `United States / The Americas / Middle East & Africa` 等分区被错误继承。

## Priority Fields

最值得提质的字段按优先级排序：

1. `section_label`
2. `title`
3. `ordinal`
4. `publication_display_name`
5. `issue_label`

## Mixed Scenario Impact

- 对 mixed preview 体验影响最大的是 `the_atlantic` 与 `the_economist`。
- `the_atlantic` 的问题会直接把 feed/search 中的 section 展示变成长 excerpt。
- `the_economist` 的问题会让搜索分区与 publication 浏览显得不可信。

## Acceptable Best-effort Warnings

- `economist_filename_anomaly`：可保留为 best effort，只要不污染整期质量判断。
- 少量 `display_warning_suppression`：可接受，只要 override 可追踪。
