# Stage DATA3 Taxonomy Audit

## Publication Differences

- `barrons`
  - `section_label` 混合了栏目名、文章级标题、专题页名。
  - 典型问题不是缺 section，而是 section 粒度过细且不稳定，跨刊浏览时噪音大。
- `the_atlantic`
  - `section_label` 相对稳定，主要集中在 `Front` / `Dispatches` / `Opening Argument` / `Culture & Critics`。
  - 可较低成本归并到国际报道、观点、文化评论。
- `the_economist`
  - `section_label` 结构化最强，但保留明显 publication identity，如 `Britain` / `China` / `Leaders` / `Briefing`。
  - 适合映射到 canonical bucket，同时保留 raw regional label。
- `readers_digest`
  - `section_label` 偏杂志栏目语义，如 `封面故事` / `精选专栏` / `本期文章` / `深度阅读`。
  - 适合映射到 feature / departments / cover story，不要求与新闻刊物完全同构。

## Canonicalization Candidates

- 可直接归并：
  - Atlantic `Front` / `Dispatches` -> `world_dispatch`
  - Atlantic `Opening Argument` + Economist `Leaders` / `By Invitation` / `The Economist` -> `opinion`
  - Atlantic `Culture & Critics` -> `culture`
  - Economist `Briefing` -> `briefing`
  - Reader's Digest `封面故事` -> `cover_story`
  - Reader's Digest `本期文章` / `深度阅读` -> `feature`
- 应保留 publication-specific identity：
  - Economist 区域 label：`Britain`, `Europe`, `China`, `Asia`, `United States`, `Middle East & Africa`, `The Americas`
  - Barron's 某些专题型 raw label，仍需保留原始标题感知

## Required Canonical Fields

- `raw_section_label`
- `canonical_section_key`
- `canonical_section_label`
- `discovery_bucket`
- `publication_section_path`
- `taxonomy_warnings`

## Raw-only Or Publication-led Fields

- `section_label`
- `section_key`
- `tags`
- source path / heading 类字段

## Current DATA2 RC Discovery Pain Points

- Barron's article-title-like section 在跨刊列表里像 tag 噪音，而不像稳定栏目。
- Atlantic / Economist 在 search/filter 里缺少统一 canonical axis，publication filter 与内容主题分组脱节。
- current search 只能按 publication / tag / reading mode 检索，不能按更稳定的 canonical taxonomy 浏览。
