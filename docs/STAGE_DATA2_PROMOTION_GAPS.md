# Stage DATA2 Promotion Gaps

## Why Mixed Preview Is `hold_warning`

- OPS2 当前 hold 来源：
  - `gate:the_economist__20260314:economist_section_context_fallback`
  - `gate:the_economist__20260314:economist_filename_anomaly`
  - `quality:unresolved_warning_count:2`
  - `quality:override_count:10`
  - diff warning taxonomy increase
  - diff override count increase

## Which Warnings Need Real Fixing

优先应修复或压缩的是真正会影响 release decision 稳定性的 warning：

1. `the_economist` 单文章 unresolved warning
2. scenario 级别对 `override_count` 的泛化噪音
3. promotion decision 对 accepted best-effort / preview-only anomaly 的缺少显式 registry 消费

## Which Warnings Can Stay

- Reader's Digest `best_effort_ordinal_missing`
  - 仅作为 baseline best-effort 缺口存在
- Economist 单文章 anomaly
  - 可保留在 preview-only scenario 中
  - 必须进入 accepted registry，并受 issue/scenario budget 约束

## Override Drift Classification

### Reasonable Editorial Refinement

- `the_atlantic`
  - 将长 merged excerpt 收敛为稳定 section label
  - 抑制已恢复标题的 `atlantic_filename_truncated` 显示噪音
  - 这些 override 更接近“展示面修整”

### Should Still Be Watched

- `the_atlantic` 当前 override 也暴露 parser/normalizer 尚未把 `section_key` / tags 一并收敛
- 但这类 drift 当前未形成 unresolved warning，不作为 DATA2 block

## Release-Candidate Conclusion

- mixed preview 适合作为 preview-only 混合观察场景
- release-candidate 应从 mixed 内容池中筛出“通过 budget 的 issue”
- DATA2 第一版 release-candidate 目标：至少一个 multi-publication candidate 达到 `promotable`
