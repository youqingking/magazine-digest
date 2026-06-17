---
name: launch-package-agent
description: Assemble the 8-agent Play Store launch-prep readiness package from evidence-bound agent outputs without approving submission or executing production actions.
---

# launch-package-agent

## Goal

`launch-package-agent` 汇总前七个 Play Store agents 的 evidence-bound outputs，并在 L3 workflow 结束时直接生成 owner 可读的中文发布准备报告。报告必须回答：现在有什么、缺什么、哪些只是 draft、哪些 blocker 未解、下一步谁处理、当前能不能提交 Google Play。

本 agent 不提交 Google Play，不调用 Play Console API，不使用 credentials，不执行 C5 production action。所有 C3/C4/C5 相关结论保持 `human review required`。

## Required Inputs

- 前七个 Play Store agent 的 machine-readable outputs。
- `docs/harness/play-store-agent-harness/INPUT_CONTRACT.md`
- `docs/harness/play-store-agent-harness/OUTPUT_CONTRACT.md`
- `docs/harness/play-store-agent-harness/EVIDENCE_LEDGER.md`
- `docs/harness/play-store-agent-harness/HUMAN_APPROVAL_GATE.md`
- `docs/harness/play-store-agent-harness/AGNO_STEP_PROTOCOL.md`
- `docs/harness/play-store-agent-harness/RUN_ARTIFACT_SCHEMA.md`
- `docs/harness/play-store-agent-harness/AGENT_PLUGIN_SPEC.md`
- 当前 L3 `run_id`、branch、commit、validator results、step artifacts。

## Expected Outputs

L3 workflow 必须把最终包写到 run-scoped 目录：

- `artifacts/launch-package/{run_id}/PLAY_STORE_RELEASE_READINESS.zh-CN.md`
- `artifacts/launch-package/{run_id}/readiness-report.md`
- `artifacts/launch-package/{run_id}/manifest.json`
- `artifacts/launch-package/{run_id}/launch-package-agent-output.json`
- `artifacts/launch-package/{run_id}/NEED_HUMAN.md`
- `artifacts/launch-package/{run_id}/FILES_INCLUDED.txt`

`PLAY_STORE_RELEASE_READINESS.zh-CN.md` 是 owner 首读报告，必须中文为主，不得写成 validator log。`readiness-report.md` 可以作为同内容的兼容报告，但仍应面向人类。

## Do / Do Not Rules

Do:

- 汇总 8-agent outputs、validators、Agno L3 step artifacts、human gates 和 blockers。
- 按 release/build、privacy、Data Safety、listing、screenshot、Play Console 分组说明材料状态。
- 对每个缺口写清 owner / Pro / dev 负责人类型、所需输入、产出、解除的 blocker。
- 有 unresolved blocker 时，`readiness` 不得为 `GREEN`。
- screenshot capture blocked 时，必须明确 `not screenshots captured`。
- 把 drafts 标成 draft，并说明不能直接用于 public/store。

Do not:

- not final: 不得把 draft 包装成已定稿材料。
- not approved: 不得声明 Data Safety、listing、privacy 或 release 已通过人工审批。
- not submitted: 不得声明已经提交 Google Play。
- not production_ready: 不得声明可生产发布。
- 不得调用 Play Console API。
- 不得添加或读取 real credentials。
- 不得执行 C5 action。

## Bundled Resources

- `scripts/validate.py`: thin skill-local validator entrypoint; delegates to `play-store-launch/validators/validate_launch_package_agent.py`.
- `references/boundary.md`: load before changing ownership, evidence inputs, validator bindings, or workflow integration.

Do not copy shared runtime, model client, evidence helpers, or renderers into this skill. Keep shared code in `play-store-launch/shared/`.

## Validation Steps

validator command:

```powershell
python scripts/agent_tools/validate_launch_package_agent.py .
python scripts/agent_tools/validate_play_store_agno_l3.py .
python scripts/agent_tools/validate_play_store_agent_mvp.py .
git diff --check
git status --short
```

## Final Report Format

最终给 owner 的报告必须包含：

- Run id
- `artifacts/launch-package/{run_id}/` 输出目录
- `PLAY_STORE_RELEASE_READINESS.zh-CN.md` 路径
- readiness: `GREEN` / `YELLOW` / `RED`
- 当前是否可以提交 Google Play：是 / 否
- 主要 blockers
- validation results
- commit hash

## Human Approval Points

- Play Console account/app/source-of-truth。
- EAS owner/projectId/build profile、signed Android build、signing policy。
- Privacy policy URL、Developer contact、Data Safety owner answers。
- Listing copy、category、content rating、target audience、public asset selection。
- Screenshot capture device/emulator and public screenshot usage。
- 所有 C3/C4/C5 claims 必须保持 `human_review_required=true`，直到 owner / Pro 明确审批。
