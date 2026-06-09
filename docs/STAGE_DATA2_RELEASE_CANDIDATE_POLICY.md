# Stage DATA2 Release Candidate Policy

## Policy

- mixed preview 可继续存在，但不默认等于 release candidate
- release-candidate scenario 仅纳入满足 release budget 的 issue
- inclusion / exclusion 必须可追踪，且 operator 无需手改 json

## DATA2 v1 Candidate

- candidate scenario id:
  - `data2_multi_publication_release_candidate`
- included issues:
  - `readers_digest__12112025`
  - `barrons__09022026`
  - `the_atlantic__012026`
  - `the_economist__20260314`
- excluded issues:
  - none in the current four-publication candidate

## Inclusion Rules

- issue unresolved warning 必须在 release budget 内
- release candidate 若存在已知 anomaly，必须在 `accepted-warnings.json` 中显式登记，不允许隐式放行
- issue 必须已通过 TEST1 所依赖的 contract / parser golden / app consumption 基础链路

## Output Requirements

- candidate manifest
- inclusion / exclusion rationale
- release-candidate report
- promotion readiness report

## Safety

- baseline scenario 保留且可回退
- 不静默覆盖 current
- 不通过 force publish 宣称成功
- 单刊 zip 与多目录混合 zip 的 issue 均可进入 candidate，但必须先落到 publication / issue / scenario registry，再由 budget 决定纳入与否
