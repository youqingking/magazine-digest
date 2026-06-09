# Stage DATA1C Decisions

## Scope

- 处理 `Three-release.zip`
- 将其拆为 3 个 publication / issue，而不是一个混合 issue
- 新增 split-audience pairing 导入模式
- 生成 3 个单刊 scenario 和 1 个 mixed preview scenario
- 不自动发布 mixed scenario 到 current

## Pack Mapping

- `Barron’s-09022026-release` -> `barrons` / `Barron's` / `09022026`
- `The Atlantic-012026-release` -> `the_atlantic` / `The Atlantic` / `012026`
- `TheEconomist20260314-release` -> `the_economist` / `The Economist` / `20260314`

## Import Decision

- adult/youth 采用同 basename 配对
- merged 仅作标题纠偏、顺序参考、section 辅助元数据来源
- `start_page` 本阶段不是必填，默认允许 `null`

## Runtime Decision

- 继续沿用 DATA1B 的 selected scenario + current mirror 机制
- Three-release 导入默认只生成 scenario，不发布
- Reader's Digest baseline scenario 继续保留且不被静默替换
