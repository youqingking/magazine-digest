# Agno L3 Runbook

## Purpose

本 runbook 说明如何运行 repo-owned Agno L3 Play Store workflow。L3 在这里表示真实 Agno workflow orchestration 已执行，并生成可验证 provenance artifacts；它不表示 Play Store readiness 为 GREEN，也不表示可以提交 Google Play。

## Dependency Pin

Python-first dependency pin 位于：

```powershell
docs/agno/requirements-agno.txt
```

安装命令：

```powershell
python -m pip install -r docs/agno/requirements-agno.txt
```

当前 pin：

```text
agno==2.6.12
```

## Runner Command

```powershell
python scripts/agent_tools/run_play_store_agno_workflow.py --root . --mode local-l3
```

Runner 会创建：

```text
artifacts/agno/play-store/l3/<run_id>/run.json
artifacts/agno/play-store/l3/<run_id>/steps/*.json
artifacts/agno/play-store/l3/<run_id>/logs/*.txt
```

## Validation Command

```powershell
python scripts/agent_tools/validate_play_store_agno_l3.py .
```

## Safety Boundary

L3-A 允许：

- 使用 repo-pinned Agno dependency。
- 使用 `agno.workflow.Workflow` 编排 8-agent local workflow。
- 调用每个 agent adapter。
- 调用每个 agent validator。
- 写入 `artifacts/agno/play-store/l3/<run_id>/**`。

L3-A 禁止：

- Play Console API。
- Google Play submission。
- real credentials。
- production/account/C5 action。
- 将 unresolved human gates 自动升级为 GREEN readiness。
- 伪造 screenshot。

## Expected Result

当前期望：

- `agno_status`: `real_run`
- `execution_mode`: `real_agno_orchestration`
- 8 个 step artifacts 均由 runner 生成。
- 旧有 agent outputs 不被修改。
- `readiness_color`: `RED`
- `screenshot-capture-agent` 如无设备/模拟器，仍应记录 `capture_status=blocked`。

## Required Verification

```powershell
python scripts/agent_tools/run_play_store_agno_workflow.py --root . --mode local-l3
python scripts/agent_tools/validate_play_store_agno_l3.py .
python scripts/agent_tools/validate_play_store_agent_mvp.py .
npm.cmd ci
npm.cmd --prefix apps/mobile run typecheck
npm.cmd --prefix apps/mobile run smoke:fixture
npm.cmd --prefix apps/mobile run start:smoke
npm.cmd run validate:preflight
git diff --check
git status --short
```
