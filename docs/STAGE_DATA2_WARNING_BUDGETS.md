# Stage DATA2 Warning Budgets

## Budget Layers

- publication
- issue
- scenario
- warning taxonomy

## Status Classes

- `accepted_best_effort`
  - 已知质量欠口，但不应反复扰动 promotion decision
- `temporary_override`
  - 当前通过 override 消化，后续可继续回收进 parser/normalizer
- `release_blocking`
  - 超预算或未登记 warning，不能 promotion

## Initial Budgets

### Reader's Digest

- issue: `readers_digest__12112025`
- taxonomy: `best_effort_ordinal_missing`
- class: `accepted_best_effort`
- budget:
  - baseline scenario: allowed
  - multi-publication release candidate: not applicable

### The Atlantic

- issue: `the_atlantic__012026`
- taxonomy: `atlantic_filename_truncated`
- class: `temporary_override`
- budget:
  - import warnings allowed when fully suppressed for display
  - unresolved warnings budget must remain `0`

### The Economist

- issue: `the_economist__20260314`
- taxonomy:
  - `economist_section_context_fallback`
  - `economist_filename_anomaly`
- class:
  - preview: `accepted_best_effort`
  - release candidate: `release_blocking`
- budget:
  - preview-only mixed scenario may allow exactly `1` article carrying both warnings
  - release-candidate scenario allows `0` unresolved warnings of these types

## Budget Discipline

- budget 必须有数量上限
- 未登记 taxonomy 默认不接受
- accepted registry 只影响 decision，不会抹掉原始 warning
- promotion report 必须显式显示：
  - within budget
  - over budget
  - unregistered
