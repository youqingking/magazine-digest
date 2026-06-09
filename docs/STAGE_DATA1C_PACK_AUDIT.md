# Stage DATA1C Pack Audit

## Release Mapping

- `Barron’s-09022026-release` -> `publication_id = barrons`, `issue_label = 09022026`
- `The Atlantic-012026-release` -> `publication_id = the_atlantic`, `issue_label = 012026`
- `TheEconomist20260314-release` -> `publication_id = the_economist`, `issue_label = 20260314`

## File Counts

- Barron's: `adult = 17`, `youth = 17`, `merged = 2`, `paired = 17`
- The Atlantic: `adult = 10`, `youth = 10`, `merged = 2`, `paired = 10`
- The Economist: `adult = 51`, `youth = 51`, `merged = 2`, `paired = 51`

## Pairing Stability

- 三个 release 都可按同 basename 稳定配对
- 当前未发现 adult-only 或 youth-only 文件
- 因此 DATA1C 以“同 basename 优先、同序号兜底”的 split-audience pairing 落地

## Known Naming / Metadata Issues

- Barron's 顶层目录名带弯引号，需要归一化为 `barrons`
- The Atlantic 文件名存在截断、断词与缺号现象，例如缺 `004`、`OPE_NING_A_RGU_M_E_N_T`
- The Economist 文件总体序号稳定，但存在 `024_but-islam.md` 这类弱语义文件名，需要依赖顺序与 section context

## Merged File Usefulness

- Barron's merged: 可用于标题纠偏和顺序参考，section 能力弱
- The Atlantic merged: 可用于标题纠偏和文章存在性校验，section 仅作弱辅助
- The Economist merged: 可用于顺序参考，section 主要仍由文件名/层级恢复
