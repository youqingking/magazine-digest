# PLAY_STORE_LAUNCH_WORKFLOW

## Launch Readiness Main Entry

普通用户主入口是一次 8-agent launch-readiness workflow，而不是 M0/M1 audit 文档：

```powershell
python scripts/agent_tools/run_play_store_agno_workflow.py --root . --mode launch-readiness
```

主输出目录：

```text
artifacts/play-store-launch/<run-id>/
```

该目录包含 `run.json`、`launch-readiness.zh.md`、`launch-readiness.json`、`evidence-ledger.jsonl`、`human-review.md`，以及 `steps/<agent-name>/output.json`、`steps/<agent-name>/evidence.jsonl`、`steps/<agent-name>/summary.zh.md`。M0/M1 Reality Gate 与 reality artifacts 保留为 audit/reference，不作为普通用户主入口。

当前 `launch-readiness` 运行分类由 `run.json` 的 `agno.maturity` 决定：模型配置可用且 8 个 agent 均完成真实模型调用时才可标记 `A3 model-backed per-agent run`；模型缺失或任一模型调用失败时必须标记 `blocked_model_unavailable` 并返回失败。Play Store、privacy、legal、Data Safety、screenshot、submission 相关结论继续 fail-closed；`can_submit_google_play=false`，`safe_to_strengthen_final_store_claims=false`。

Goal 1.6 起，`launch-readiness` 主命令要求每个 agent step 都是 `fresh_ai_agent_run`，并且必须真实调用模型。模型配置通过环境变量提供，例如 `OPENAI_API_KEY` 加 `PLAY_STORE_AGENT_MODEL` 或 `OPENAI_MODEL`；如需自定义端点，可设置 `PLAY_STORE_AGENT_MODEL_BASE_URL`、`MODEL_BASE_URL` 或 `OPENAI_BASE_URL`。缺少模型配置时，workflow 必须输出 `blocked_model_unavailable` 并返回失败；validator 不允许 deterministic-only fallback 通过。即使 8 个 agent 都完成模型调用，A3 也只表示 model-backed draft run，不代表 production-ready、legal approval、store approval 或 cross-PRD proven。

当前 provider 支持两种路径：`openai` API provider 保留但不作为本轮验收主路径；`codex_cli` provider 通过 ChatGPT 登录态或 CLI 缓存认证调用 `codex exec`，每个 agent 必须使用 `--sandbox read-only`、`--ephemeral`、`--output-schema`、`--output-last-message`，成功 run 标记为 `A3_CODEX_CLI_BACKED`。该标记只代表 Codex CLI backed draft run，不代表 Play Store ready。

## Goal

让 Agno 在 dry-run 安全边界内运行 8-agent Play Store launch preparation workflow。当前 production action status 仍是 `dry_run_only`：该 workflow 只整理 repo-local evidence、draft docs、validators 和 blocker report，不进行 Google Play submission。

## Canonical Paths

- Release gate: `docs/launch/release/PLAY_STORE_RELEASE_GATE.md`
- Release dry-run note: `docs/release/PLAY_STORE_RELEASE_DRY_RUN.md`
- Listing validation report: `docs/launch/google-play/listing-validation-report.md`
- Screenshot validation notes: `docs/launch/screenshots/screenshot-validation-notes.md`
- Privacy human-review gate: `docs/launch/privacy/human-review-required.md`
- Privacy inventories: `docs/privacy/DATA_INVENTORY.md`, `docs/privacy/SDK_INVENTORY.md`

## Workflow

### Step 0: Intake

读取：

- `AGENTS.md`
- `docs/NEED_HUMAN.md`
- `docs/factory/APP_FACTORY_PHASE_A_REUSE_GUIDE.md`
- `docs/agents/PLAY_STORE_AGENT_REGISTRY.md`
- `docs/launch/LAUNCH_INFO.md`
- `docs/launch/store-fields/source-of-truth.json`

输出：

- 当前 app facts。
- 当前 blocker list。
- 是否仍满足 no-credential boundary。

### Step 1: Release Build Agent

调用 `release-build-agent`：

- 更新 `docs/launch/release/PLAY_STORE_RELEASE_GATE.md`。
- 确认 `Google Play submission out of scope`。
- 运行 `validate_release_build_agent.py`。
- 输出 release blockers。

### Step 2: Privacy Disclosure Prep

调用 `privacy-disclosure-prep`：

- 更新 `DATA_INVENTORY.md` 和 `SDK_INVENTORY.md`。
- 更新 `docs/launch/privacy/human-review-required.md` 作为 canonical privacy review gate。
- 更新 Data safety draft。
- 更新 Data safety evidence。
- 标记所有 privacy/legal conclusions 为 `human review required`。
- 运行 `validate_privacy_disclosure_prep.py`。

### Step 3: Google Play Listing

调用 `google-play-listing`：

- 校验 source-of-truth。
- 更新 `listing.en-US.json` 和 `listing.zh-CN.json`。
- 检查 `appName`、`shortDescription`、`fullDescription` 长度。
- 更新 `listing-validation-report.md`。
- 确认 copy 不展示未实现能力。
- 运行 `validate_google_play_listing.py`。

### Step 4: Screenshot Storyboard

调用 `screenshot-storyboard`：

- 更新 storyboard。
- 更新 shot-list。
- 更新 `screenshot-validation-notes.md`。
- 确认 screenshots 只引用 current routes。
- 运行 `validate_screenshot_storyboard.py`。

### Step 5: Aggregate Gate

### Step 5: Launch Info Collector

调用 `launch-info-collector`：

- 更新 `docs/launch/LAUNCH_INFO.md`。
- 更新 `docs/launch/store-fields/source-of-truth.json`。
- 确认每个 store field 都有 `observed_in_repo` / `inferred` / `missing` / `needs_human` status。
- 运行 `validate_launch_info_collector.py`。

### Step 6: Google Data Safety Agent

调用 `google-data-safety-agent`：

- 更新 Data Safety evidence draft。
- 更新 `data-safety-human-review-required.md`。
- 确保 `C3` / `C4` claims 设置 `human_review_required=true`。
- 运行 `validate_google_data_safety_agent.py`。

### Step 7: Screenshot Capture Agent

调用 `screenshot-capture-agent`：

- 检查真实 capture 条件。
- 缺少 device/emulator 时输出 `capture_status=blocked`。
- 不伪造 screenshots。
- 运行 `validate_screenshot_capture_agent.py`。

### Step 8: Launch Package Agent

调用 `launch-package-agent`：

- 汇总 8-agent outputs。
- 输出 `artifacts/launch-package/manifest.json` 和 readiness report。
- readiness 只能是 `GREEN`、`YELLOW` 或 `RED`；当前 unresolved gates force `RED`。
- 运行 `validate_launch_package_agent.py`。

### Step 9: Aggregate Gate

运行：

```powershell
python scripts/agent_tools/validate_play_store_agent_mvp.py .
git diff --check
git status --short
```

如需完整 repo confidence，再运行用户指定的 npm 验证命令，并恢复非预期 generated outputs。

## Success Criteria

Dry-run 成功只表示：

- 所有 required docs/Skills/evals/validators 存在。
- Local validators pass。
- No credentials detected in agent layer。
- Listing、Data safety、screenshots、release gate 都保留 draft/human review boundary。
- `PLAY_STORE_SUBMISSION_READINESS.md` 仍把 submission 标为 blocked。
- 8-agent launch-prep readiness package exists and remains `RED` until owner/Pro review.

## Failure Classification

| Status | Meaning |
| --- | --- |
| `pass` | Local validator 或命令成功。 |
| `fail` | 本地文件或规则不满足，需要修正。 |
| `blocked` | 需要外部决策或真实服务，agent 不应继续。 |
| `tool_missing` | 本地工具缺失。 |
| `environment_blocked` | 环境不可用，例如网络、SDK、desktop/device。 |
| `NEED_HUMAN` | 需要人工账号、凭据、法律、隐私、商标、submission 或 release 决策。 |

## Out Of Scope

- Google Play API calls。
- `eas submit`。
- Production release build signing。
- Supabase / RevenueCat / Push live integration。
- Final screenshot asset generation。
- Final privacy/legal/trademark approval。

## Dry-Run Answer

Agno 可以 dry-run 这个 workflow；不能 submit、不能加 credentials、不能改 app behavior。

M2 boundary: `dry_run_only` 只表示 Agno-ready step artifacts 存在于 `artifacts/agno/play-store/m2/*.json`，不表示真实 Agno runtime 已运行，也不表示任何 agent 达到 `L3`。
