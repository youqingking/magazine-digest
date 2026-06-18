# Agno L3 Runtime Adoption Plan

## Scope

本报告只做 L3 Agno runtime adoption audit，不实现 L3，不修改 agent 输出、validator、artifact、launch/privacy/release 输出。

| Item | Value |
| --- | --- |
| Branch | `codex/play-store-agent-harness-mvp-m1` |
| Audit commit | `6d8a8a0` |
| Current harness maturity | `H2` |
| Current agent maturity | 8 agents at `L2` |
| Current Agno status | `dry_run_only` |
| L3 implementation in this change | no |

## Evidence Reviewed

只基于以下 repo-local evidence 判断：

- `docs/agno/AGNO_RUNTIME_CHECK.md`
- `docs/agno/PLAY_STORE_AGENT_TEAM.md`
- `docs/agno/PLAY_STORE_LAUNCH_WORKFLOW.md`
- `docs/agno/runs/play-store-m2-old-four-run-20260612.md`
- `artifacts/agno/play-store/m2/*.json`
- `artifacts/agno/play-store/m4/*.json`
- `docs/harness/play-store-agent-harness/AGNO_STEP_PROTOCOL.md`
- `docs/harness/play-store-agent-harness/RUN_ARTIFACT_SCHEMA.md`
- `docs/harness/play-store-agent-harness/AGENT_PLUGIN_SPEC.md`
- `scripts/agent_tools/play_store_agent_validation_lib.py`
- `scripts/agent_tools/validate_play_store_agent_harness.py`
- `scripts/agent_tools/validate_play_store_agent_mvp.py`
- `.agents/skills/*/SKILL.md`
- `docs/agents/PLAY_STORE_AGENT_MVP_FINAL_REVIEW.md`
- `docs/agents/PLAY_STORE_AGENT_MVP_VALIDATION_RESULTS.md`

## 1. Current Agno Runtime Status

当前 repo-owned Agno runtime 不存在。

已确认事实：

- `AGNO_RUNTIME_CHECK.md` 记录 repo 没有 pinned `agno` dependency。
- `AGNO_RUNTIME_CHECK.md` 记录没有 repo Agno runner、workflow entrypoint、run report、trace writer。
- Host Python 曾能 import `agno`，但这是机器全局环境能力，不属于 repo governance，不能作为可复现 L3 runtime。
- `PLAY_STORE_AGENT_TEAM.md` 与 `PLAY_STORE_LAUNCH_WORKFLOW.md` 是 Agno-ready / dry-run workflow 文档，不是可执行 workflow entrypoint。
- 现有 validators 会验证 Agno dry-run artifacts，但不会启动 Agno workflow。

结论：当前 Agno status 仍为 `dry_run_only`。不能声明 `real_run_possible`，也不能声明 `L3`。

## 2. Why Current Dry-Run Artifacts Are Not L3

当前 `artifacts/agno/play-store/m2/*.json` 和 `artifacts/agno/play-store/m4/*.json` 不能算 L3，原因如下：

- 每个 artifact 的 `agno_status` 都是 `dry_run_only`。
- 每个 artifact 的 `maturity_level` 都是 `L2`，不是 `L3`。
- Artifact 符合 `play_store_agno_step_artifact.v1` shape，但没有真实 Agno runner provenance。
- 没有 `run_id` 对应的可执行 command、stdout/stderr capture、exit code、start/end timestamp、duration、trace link。
- 没有证据表明 artifact 由 Agno workflow 在当前 commit 上实际执行生成。
- `validate_agno_step_artifact` 明确要求 `agno_status=dry_run_only`，并拒绝 `real_run=true` 与 `L3`。
- `validate_play_store_agent_mvp.py` 输出 `agno_dry_run_ready=true`，这是 dry-run readiness，不是 runtime adoption。

L3 需要证明“真实 Agno workflow 执行过 8 个 steps，并生成可追溯 run artifact”。当前 artifacts 只证明“L2 Agno-ready artifact 存在且结构有效”。

## 3. Missing Runner / Adapter / Validator For L3

要达到 L3，需要新增以下能力。以下是未来 implementation scope，不属于本 audit 实现内容。

### Runner

建议新增一个最小 runner：

- `scripts/agent_tools/run_play_store_agno_workflow.py`

职责：

- 加载 repo-pinned Agno dependency。
- 构造 8-agent workflow / team。
- 按固定 step order 执行 8 个 agent。
- 将每个 step 的 input refs、output refs、claim ids、validator result、stdout/stderr summary、exit code、start/end timestamp 写入 run artifact。
- 在任何 C5、credential、Play Console、submission、production action 请求上 fail closed。
- 将 unresolved human gates 保持为 `needs_human` / `blocked`，不自动升级 readiness。

### Adapters

建议新增 agent adapter layer，例如：

- `scripts/agent_tools/play_store_agno_adapters.py`

每个 adapter 需要把 Skill contract 转成可执行 step：

- 读取 Common Harness contracts。
- 读取 agent-specific allowed inputs。
- 调用对应 agent 逻辑或受控 generation step。
- 写入 human-readable output 与 machine-readable output。
- 运行 agent-specific validator。
- 返回 step result 给 runner。

### L3 Validator

建议新增：

- `scripts/agent_tools/validate_play_store_agno_l3.py`

职责：

- 验证 repo-owned runtime dependency。
- 验证 runner command 可执行。
- 验证 run artifact 是当前 runner 在当前 commit 生成。
- 验证 8 个 step artifact 是真实 Agno step result，不是手写 dry-run placeholder。
- 验证所有 agent validators 在 workflow 内被调用并记录结果。
- 验证 `dry_run_only` 没有被标为 `L3`。

## 4. Dependency / Package Lockfile Decision

L3 需要新增 repo-owned dependency pin。否则无法证明 runtime 可复现。

推荐 owner 二选一：

1. Python-first adoption：
   - 新增 Python dependency file，例如 `requirements/agno.txt`、`pyproject.toml` 或 `uv.lock`。
   - 不需要修改 `package.json` / `package-lock.json`，除非要增加 npm wrapper command。
2. Node wrapper adoption：
   - 如果 owner 希望用 `npm run` 暴露 L3 command，可以只新增 npm script wrapper。
   - 如果 wrapper 需要 npm dependency，则会修改 `package.json` / `package-lock.json`。

当前 audit 不修改 dependency、package manifest 或 lockfile。进入 L3 implementation 前必须由 owner 明确批准 dependency pin 位置与 lockfile 策略。

## 5. Recommended Minimal L3 Runner Design

推荐最小 L3 runner 保持 no-credential、no-submit、repo-local boundary：

```powershell
python scripts/agent_tools/run_play_store_agno_workflow.py --root . --mode local-l3 --run-id play-store-l3-YYYYMMDD-HHMMSS
python scripts/agent_tools/validate_play_store_agno_l3.py .
```

推荐输出：

- `artifacts/agno/play-store/l3/<run_id>/run.json`
- `artifacts/agno/play-store/l3/<run_id>/steps/release-build-agent.json`
- `artifacts/agno/play-store/l3/<run_id>/steps/privacy-disclosure-prep.json`
- `artifacts/agno/play-store/l3/<run_id>/steps/google-play-listing.json`
- `artifacts/agno/play-store/l3/<run_id>/steps/screenshot-storyboard.json`
- `artifacts/agno/play-store/l3/<run_id>/steps/launch-info-collector.json`
- `artifacts/agno/play-store/l3/<run_id>/steps/google-data-safety-agent.json`
- `artifacts/agno/play-store/l3/<run_id>/steps/screenshot-capture-agent.json`
- `artifacts/agno/play-store/l3/<run_id>/steps/launch-package-agent.json`

推荐 run-level schema 增加或确认字段：

- `schema_version`
- `run_id`
- `execution_mode`
- `agno_status`
- `runner_command`
- `runner_version`
- `dependency_lock_ref`
- `branch`
- `commit`
- `started_at`
- `finished_at`
- `step_order`
- `step_artifacts`
- `validation_results`
- `human_approval_summary`
- `readiness_color`
- `blocked_reasons`

推荐 step-level schema 在现有 `play_store_agno_step_artifact.v1` 基础上增加 L3 provenance：

- `execution_mode`
- `runtime_provenance`
- `started_at`
- `finished_at`
- `duration_ms`
- `exit_code`
- `stdout_ref`
- `stderr_ref`
- `validator_command`
- `validator_exit_code`
- `input_hashes`
- `output_hashes`
- `generated_by_runner`

## 6. How Each Agent Becomes A Real Step

| Step | Agent | L3 execution expectation | Allowed result |
| --- | --- | --- | --- |
| 1 | `release-build-agent` | Runner invokes release step, records build/typecheck/smoke/preflight evidence and release blockers. | `L3` step may pass with release readiness `blocked` / `needs_human`. |
| 2 | `privacy-disclosure-prep` | Runner invokes privacy scan step, records DATA_INVENTORY / SDK_INVENTORY evidence and C3 gates. | `L3` step may pass with C3/C4 human gates open. |
| 3 | `google-play-listing` | Runner invokes listing draft step, validates field limits and banned wording. | `L3` step may pass with listing `draft` and owner/Pro review required. |
| 4 | `screenshot-storyboard` | Runner invokes storyboard step against route / scenario / fixture evidence. | `L3` step may pass without raw screenshots. |
| 5 | `launch-info-collector` | Runner invokes source-of-truth collection step and preserves `observed_in_repo` / `inferred` / `missing` / `needs_human`. | `L3` step may pass with missing Play Console fields. |
| 6 | `google-data-safety-agent` | Runner invokes Data Safety evidence draft step from privacy inventories and SDK evidence. | `L3` step may pass only as evidence draft, not Play Console answer. |
| 7 | `screenshot-capture-agent` | Runner invokes real environment check for device/emulator/route rendering. If missing, it records `capture_status=blocked`. | `L3` step may pass as executed step with blocked capture. |
| 8 | `launch-package-agent` | Runner aggregates the first seven step outputs and human gates into readiness package. | `L3` step may pass with readiness `RED`. |

Important boundary: L3 means real Agno orchestration executed. It does not mean Play Store readiness is GREEN.

## 7. Screenshot Capture Blocked: L3 Blocker Or Readiness Blocker

`screenshot-capture-agent` being blocked does not inherently block L3 runtime adoption.

It blocks Play Store readiness and raw screenshot completion, not the existence of a real Agno workflow.

For L3, the required proof is:

- The screenshot capture step actually executed inside the Agno workflow.
- The step performed a real local environment check.
- The step truthfully emitted `capture_status=blocked` when no device/emulator/route rendering was available.
- No fabricated screenshots were generated.
- The run artifact records blocker evidence and validator result.

Therefore screenshot capture can be an L3 executed step with a blocked business result. It should force readiness `RED`, but should not prevent L3 runtime validation if the step execution and blocking evidence are real.

## 8. L3 Validator Requirements

`validate_play_store_agno_l3.py` must check at least:

- Repo-owned Agno dependency exists and is pinned.
- Runner command exists and is documented.
- Runner command creates a new run directory for the current run.
- Run artifact includes branch, commit, runner command, dependency lock ref, timestamps, and step order.
- Every step artifact was produced by the runner, not pre-existing M2/M4 dry-run placeholder.
- Every step has `execution_mode` indicating real Agno execution.
- `agno_status` is upgraded only when runtime proof exists.
- No artifact keeps `dry_run_only` while claiming `L3`.
- No artifact claims `real_run` without runner provenance.
- All 8 agent steps are present and ordered.
- Every step records input refs, output refs, claim ids, claim classes, evidence ledger refs, human gate refs, validator command, validator result, and blocked reason if any.
- All existing agent validators pass inside the workflow context.
- C3/C4/C5 claims retain `human_review_required=true`.
- C5 actions remain blocker-only and are not executed.
- No Play Console API call, Google Play submission, real credentials, signing key, or production action appears in outputs or logs.
- Screenshot capture step either records real screenshot evidence with route/device/locale/commit hash, or records `capture_status=blocked`; it must never fabricate raw screenshots.
- Readiness remains `RED` or `YELLOW` when unresolved human gates exist; `GREEN` requires explicit human approval evidence.

## 9. Owner Decisions Needed

Owner must decide before L3 implementation:

- Whether to approve L3 runtime adoption at all.
- Where to pin Agno dependency: Python dependency file, lockfile, or other repo-approved dependency mechanism.
- Whether modifying `package.json` / `package-lock.json` is allowed for runner wrappers.
- Exact L3 runner path and command.
- Whether L3 run artifacts may be written under `artifacts/agno/play-store/l3/**`.
- Whether AGNO_STEP_PROTOCOL and RUN_ARTIFACT_SCHEMA may be extended for L3 provenance fields.
- Whether the runner is allowed to invoke model-backed agent generation, deterministic local adapters, or both.
- Whether real screenshot capture may run when a device/emulator is attached.
- Whether C3/C4/C5 human approval evidence can ever turn readiness from `RED` to `YELLOW` or `GREEN`.
- Whether future L3 logs may include stdout/stderr refs and how to redact sensitive data.

## 10. Can Safely Enter L3 Implementation

Current answer: no.

Reason:

- Repo-owned Agno dependency is missing.
- Runner and workflow entrypoint are missing.
- L3 run artifact schema/provenance fields are not implemented.
- L3 validator is missing.
- Owner has not approved dependency, package/lockfile, artifact path, schema extension, or execution model decisions.

Safe next step is owner review of this adoption plan. After owner approval, a separate scoped L3 implementation can add the minimal dependency, runner, adapters, L3 artifact schema update, and L3 validator.

## Final Audit Judgement

Current 8-agent Play Store workflow is `H2` / `L2` / `dry_run_only`.

It is ready for L3 design review, but not ready for L3 implementation without owner decisions. It must not be described as `L3`, `real_run`, `real_run_possible`, Play Store ready, submitted, approved, complete, or production_ready.
