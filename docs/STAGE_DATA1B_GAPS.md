# Stage DATA1B Gaps

## Reused Successfully

- DATA1A 的 Reader's Digest parser 可直接复用。
- app 当前 discovery/search/detail contract 不需要重写。
- Stage G / H0-H1a foundation 不需要因内容泛化而变形。

## Still Reader's Digest Specific

- parser profile 目前只有 `readers_digest_v1`
- 目录表补 `section_label / start_page` 的规则仍是 Reader's Digest 特化
- 标题冲突容忍规则仍按本刊已知瑕疵定义

## Remaining Gaps

- 未来新刊物仍需增加 parser profile，当前不会自动理解未知 markdown 结构。
- current runtime 仍是镜像文件夹，不是动态运行时切换。
- publication policy 目前只落了 audience 兼容策略，未做更细粒度的 per-publication override。
