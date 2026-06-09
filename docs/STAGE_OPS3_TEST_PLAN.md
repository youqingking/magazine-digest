# Stage OPS3 Test Plan

## Goals

- 证明 `data2_multi_publication_release_candidate` 可真实 apply publish
- 证明 apply 后 provenance / manifest / release notes / history 一致
- 证明 rollback 后 baseline 恢复
- 证明 preview-only scenario 真实 apply 被拒绝

## Required Commands

- `node scripts/tests/run-test1.mjs`
- `node scripts/ops/inspect-scenario.mjs --scenario data2_multi_publication_release_candidate`
- `node scripts/ops/compare-scenarios.mjs --from data1a_readers_digest_12112025 --to data2_multi_publication_release_candidate`
- `node scripts/ops/run-gate.mjs --scenario data2_multi_publication_release_candidate`
- `node scripts/ops/evaluate-promotion.mjs --scenario data2_multi_publication_release_candidate --use-existing-reports`
- `node scripts/ops/promote-scenario.mjs --scenario data2_multi_publication_release_candidate --dry-run --use-existing-reports`
- `node scripts/ops/promote-scenario.mjs --scenario data2_multi_publication_release_candidate --apply --use-existing-reports`
- `node scripts/ops/rollback-scenario.mjs --scenario data1a_readers_digest_12112025`
- `node scripts/ops/evaluate-promotion.mjs --scenario data1c_three_release_mixed_preview --use-existing-reports`
- `node scripts/ops/promote-scenario.mjs --scenario data1c_three_release_mixed_preview --apply --use-existing-reports`
- `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/smoke-stage-ops3.ps1`

## Pass Criteria

- apply target returns `status=ok`
- post-publish snapshot shows current/selected = candidate
- post-rollback snapshot shows current/selected = baseline
- preview-only apply returns rejection, not success
- `output/stage-ops3/*` required artifacts exist
