# Stage DATA1C Pairing Rules

## Parser Mode

- mode: `split_audience_release_v1`

## Pairing Rule Order

1. 同 basename 配对
2. 若 basename 不稳，再按同序号配对
3. 若仍缺一侧，记录 partial import warning，不阻塞整刊导入

## Content Mapping

- adult 文件 -> `quick_30s / deep_3m`
- youth 文件 -> `teen_quick_30s / teen_deep_3m`
- `general_quick_30s / general_deep_3m` 继续按 `adult_to_general_compat_v1`

## Metadata Priority

1. 文件内 H1 标题
2. merged block heading / merged block title
3. 清洗后的文件名

## Publication Overlays

- `barrons_release_v1`: 目录名编码归一化，标题以文件 H1 为主
- `the_atlantic_release_v1`: 容忍文件名截断，优先 H1，再用 merged 辅助纠偏
- `the_economist_release_v1`: 重点恢复 `section_label`，以序号和 section context 为主
