# Stage TEST2 Test Plan

## Required Verifications

- 两个 `report_only` 脚本在 sandbox 中并行运行
- 两个 `stateful_publish` 脚本冲突时，一个成功，一个被阻塞或 fail-fast
- stateful run 失败后 baseline/current/selected 可恢复
- OPS2 / DATA2 / OPS3 / TEST1 不回归

## Required Commands

- `node scripts/tests/run-test1.mjs`
- `node scripts/ops/run-gate.mjs --scenario data2_multi_publication_release_candidate`
- `node scripts/ops/evaluate-promotion.mjs --scenario data2_multi_publication_release_candidate --use-existing-reports`
- `node scripts/ops/promote-scenario.mjs --scenario data2_multi_publication_release_candidate --dry-run --use-existing-reports`
- `node scripts/ops/apply-promotion-drill.mjs --scenario data2_multi_publication_release_candidate`
- `node scripts/ops/run-automation-suite.mjs --suite parallel-read-only`
- `node scripts/ops/run-automation-suite.mjs --suite stateful-conflict`
- `powershell -ExecutionPolicy Bypass -File scripts/bootstrap/smoke-stage-test2.ps1`
