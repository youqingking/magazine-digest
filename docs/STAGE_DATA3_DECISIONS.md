# Stage DATA3 Decisions

## Scope

- 不重开 IA，不重做 UI2/UI3 页面结构。
- 以 metadata 增量扩展方式收敛多刊 taxonomy / discovery 体验。
- 保留 raw section 信息，同时补 canonical section / discovery bucket。
- 不改 parser 架构，不新建复杂 ontology 平台。

## Primary Outcomes

- 建立四刊可追踪的 canonical taxonomy。
- 让 `data2_multi_publication_release_candidate` 与 `data1c_three_release_mixed_preview` 都带上 taxonomy metadata。
- 让 search / feed / detail 以低强调方式消费 canonical taxonomy。
- 让 promotion decision 至少可见 taxonomy coverage，而不是对 taxonomy 质量完全失明。

## Constraints

- raw label 必须保留，不允许被 canonical label 静默覆盖。
- publication-specific identity 继续保留，尤其是 Economist 区域栏目与 Reader's Digest 杂志栏目。
- 当前 `data2_multi_publication_release_candidate` 不应因 taxonomy 收敛而失去 `promotable`。
- `data1c_three_release_mixed_preview` 继续保持 preview-only，不因为 taxonomy 改造被误升级。

## Delivery Choice

- 直接补齐现有 normalized records 与 scenario bundles，不新起复杂 candidate 旁路。
- 若个别 label 无法安全映射，进入 `taxonomy_warnings` 与 coverage report，而不是强行归并。
- DATA3 只把 unmapped taxonomy 作为 visibility/warning 输入，不把它默认升级成 blocker。
